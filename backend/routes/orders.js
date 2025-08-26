// backend/routes/orders.js
import express from "express";
import { pool } from "../db.js";
import { sendMail } from "../utils/mailer.js";
import { buildInvoiceHTML } from "../utils/invoice.js";
import { emitEvent } from "./events.js"; // 👈 مهم

const router = express.Router();

/** إرسال فاتورة بالبريد */
router.post("/:id/send-invoice", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { to } = req.body || {};
    const { html, toEmail, order } = await buildInvoiceHTML(id);

    const recipient = to || toEmail;
    if (!recipient) return res.status(400).json({ message: "No email" });

    const info = await sendMail({
      to: recipient,
      subject: `Invoice #${order.order_id} - H&Y Moda`,
      html,
      text: `Invoice for order #${order.order_id}`,
    });

    res.json({ ok: true, messageId: info.messageId });
  } catch (e) {
    next(e);
  }
});

/** GET /api/orders?user_id= */
router.get("/", async (req, res, next) => {
  try {
    const { user_id } = req.query;
    const params = [];
    let where = "";
    if (user_id) {
      where = "WHERE o.user_id = ?";
      params.push(user_id);
    }

    const [rows] = await pool.query(
      `
      SELECT 
        o.order_id, o.user_id, o.status, o.total_amount, o.order_date,
        u.username,
        (
          SELECT COALESCE(SUM(oi.quantity), 0)
          FROM order_items oi
          WHERE oi.order_id = o.order_id
        ) AS items_count
      FROM orders o
      JOIN users u ON u.user_id = o.user_id
      ${where}
      ORDER BY o.order_date DESC
      `,
      params
    );

    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/** مساعد: بثّ Low Stock لو الكمية قليلة */
async function emitLowStockIfNeeded(conn, product_id, color, size) {
  const threshold = Number(process.env.LOW_STOCK_THRESHOLD || 5);
  const [[row]] = await conn.query(
    `SELECT pv.product_id, pv.color, pv.size, pv.quantity, pv.price, p.product_name
       FROM product_variations pv
       JOIN products p ON p.product_id = pv.product_id
      WHERE pv.product_id=? AND pv.color=? AND pv.size=?`,
    [product_id, color, size]
  );
  if (row && Number(row.quantity) <= threshold) {
    emitEvent("stock.low", {
      product_id,
      color,
      size,
      quantity: Number(row.quantity),
      threshold,
      product_name: row.product_name,
    });
  }
}

/** POST /api/orders { user_id, items:[{product_id,color,size,quantity}] } */
router.post("/", async (req, res, next) => {
  let conn;
  try {
    const { user_id, items } = req.body;
    if (!user_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // احسب الإجمالي باستخدام VIEW variations
    let total = 0;
    for (const it of items) {
      const [vr] = await conn.query(
        `SELECT price FROM variations WHERE product_id=? AND color=? AND size=?`,
        [it.product_id, it.color, it.size]
      );
      if (!vr.length) {
        throw Object.assign(new Error("Variation not found"), { status: 400 });
      }
      const price = Number(vr[0].price || 0);
      total += price * Number(it.quantity || 0);
    }

    // أنشئ الطلبية
    const [ins] = await conn.query(
      `INSERT INTO orders (user_id, status, total_amount)
       VALUES (?, 'pending', ?)`,
      [user_id, total]
    );
    const order_id = ins.insertId;

    // أدخل بنود الطلب وخصم المخزون
    for (const it of items) {
      const [vr] = await conn.query(
        `SELECT price FROM variations WHERE product_id=? AND color=? AND size=?`,
        [it.product_id, it.color, it.size]
      );
      const unit = Number(vr[0].price || 0);

      await conn.query(
        `INSERT INTO order_items (order_id, product_id, color, size, quantity, unit_price)
         VALUES (?,?,?,?,?,?)`,
        [order_id, it.product_id, it.color, it.size, it.quantity, unit]
      );

      await conn.query(
        `UPDATE product_variations
            SET quantity = GREATEST(quantity - ?, 0)
          WHERE product_id=? AND color=? AND size=?`,
        [it.quantity, it.product_id, it.color, it.size]
      );

      // افحص تنبيه نقص المخزون بعد الخصم
      await emitLowStockIfNeeded(conn, it.product_id, it.color, it.size);
    }

    await conn.commit();

    // بعد نجاح العملية بثّ حدث طلبية جديدة
    emitEvent("order.created", { order_id, user_id, total_amount: total });

    res.json({ ok: true, order_id, total_amount: total });
  } catch (e) {
    try {
      if (conn) await conn.rollback();
    } catch {}
    next(e);
  } finally {
    try {
      if (conn) conn.release();
    } catch {}
  }
});

/** PUT /api/orders/:id { status } */
router.put("/:id", async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    const allowed = ["pending", "paid", "shipped", "cancelled"];
    if (!allowed.includes(String(status))) {
      return res.status(400).json({ message: "Invalid status" });
    }
    await pool.query(`UPDATE orders SET status=? WHERE order_id=?`, [
      status,
      id,
    ]);

    emitEvent("order.updated", { order_id: Number(id), status });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** GET /api/orders/:id — order + items */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const [orderRows] = await pool.query(
      `SELECT o.order_id, o.user_id, o.status, o.total_amount, o.order_date,
              u.username, u.email, u.address
         FROM orders o
         JOIN users u ON u.user_id = o.user_id
        WHERE o.order_id = ?`,
      [id]
    );
    if (!orderRows.length)
      return res.status(404).json({ message: "Order not found" });
    const order = orderRows[0];

    const [itemRows] = await pool.query(
      `SELECT oi.product_id, oi.color, oi.size, oi.quantity,
              COALESCE(oi.unit_price, v.price) AS unit_price,
              p.product_name, p.image_url
         FROM order_items oi
         JOIN products p ON p.product_id = oi.product_id
    LEFT JOIN variations v
           ON v.product_id = oi.product_id AND v.color = oi.color AND v.size = oi.size
        WHERE oi.order_id = ?`,
      [id]
    );

    const items = itemRows.map((r) => ({
      ...r,
      line_total: Number(r.unit_price || 0) * Number(r.quantity || 0),
    }));
    const subtotal = items.reduce((s, x) => s + x.line_total, 0);
    const shipping = 0;
    const tax = 0;
    const grand_total = subtotal + shipping + tax;

    res.json({
      order,
      items,
      summary: { subtotal, shipping, tax, grand_total },
    });
  } catch (e) {
    next(e);
  }
});

/** GET /api/orders/:id/invoice — printable HTML */
router.get("/:id/invoice", async (req, res, next) => {
  try {
    const { id } = req.params;

    const [oRows] = await pool.query(
      `SELECT o.order_id, o.user_id, o.status, o.total_amount, o.order_date,
              u.username, u.email, u.address
         FROM orders o
         JOIN users u ON u.user_id = o.user_id
        WHERE o.order_id = ?`,
      [id]
    );
    if (!oRows.length) return res.status(404).send("Not found");
    const o = oRows[0];

    const [rows] = await pool.query(
      `SELECT oi.product_id, oi.color, oi.size, oi.quantity,
              COALESCE(oi.unit_price, v.price) AS unit_price,
              p.product_name
         FROM order_items oi
         JOIN products p ON p.product_id = oi.product_id
    LEFT JOIN variations v
           ON v.product_id = oi.product_id AND v.color = oi.color AND v.size = oi.size
        WHERE oi.order_id = ?`,
      [id]
    );

    const items = rows.map((r) => ({
      ...r,
      line_total: Number(r.unit_price || 0) * Number(r.quantity || 0),
    }));
    const sub = items.reduce((s, x) => s + x.line_total, 0);
    const shipping = 0,
      tax = 0,
      total = sub + shipping + tax;

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Invoice #${o.order_id} - H&Y Moda</title>
<style>
  :root{ --pink:#ff7ab8; --ink:#2e2e2e; --muted:#7a7a7a; }
  body{ font-family: Inter, Arial, sans-serif; color:var(--ink); margin:24px; }
  .sheet{ width: 210mm; max-width: 100%; margin:0 auto; background:#fff; padding:24px; border:1px solid #f2c6dc; border-radius:16px; }
  .head{ display:flex; justify-content:space-between; align-items:flex-start; }
  .brand{ color:#d63384; font-weight:900; font-size:1.4rem; }
  .muted{ color:var(--muted); }
  h2{ margin:.2rem 0 0; }
  table{ width:100%; border-collapse:collapse; margin-top:16px; }
  th, td{ padding:10px; text-align:left; border-bottom:1px solid #f4d7e6; }
  th{ background:#fff1f7; }
  .right{ text-align:right; }
  .totals{ margin-top:12px; width: 320px; margin-left:auto; }
  .badge{ display:inline-block; padding:6px 10px; border-radius:999px; color:#fff; background:#d63384; font-weight:800; font-size:.85rem; text-transform:capitalize; }
  .print{ margin-top:14px; padding:10px 14px; border-radius:10px; border:none; background:#d63384; color:#fff; font-weight:900; }
  @media print{ .print{ display:none; } body{ margin:0; } .sheet{ border:none; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <div class="brand">H&Y Moda</div>
        <div class="muted">Invoice #${o.order_id}</div>
        <div class="muted">${new Date(o.order_date).toLocaleString()}</div>
      </div>
      <div>
        <div><b>Bill To</b></div>
        <div>${o.username}</div>
        <div class="muted">${o.email || ""}</div>
        <div class="muted">${o.address || ""}</div>
      </div>
    </div>

    <h2>Payment Invoice</h2>
    <div class="badge">${o.status}</div>

    <table>
      <thead>
        <tr>
          <th>Product</th><th>Color</th><th>Size</th>
          <th class="right">Qty</th><th class="right">Unit</th><th class="right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (r) => `
          <tr>
            <td>${r.product_name}</td>
            <td>${r.color}</td>
            <td>${r.size}</td>
            <td class="right">${r.quantity}</td>
            <td class="right">$${Number(r.unit_price || 0).toFixed(2)}</td>
            <td class="right">$${Number(r.line_total).toFixed(2)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <table class="totals">
      <tr><td>Subtotal</td><td class="right">$${sub.toFixed(2)}</td></tr>
      <tr><td>Shipping</td><td class="right">$${shipping.toFixed(2)}</td></tr>
      <tr><td>Tax</td><td class="right">$${tax.toFixed(2)}</td></tr>
      <tr><th>Total</th><th class="right">$${total.toFixed(2)}</th></tr>
    </table>

    <button class="print" onclick="window.print()">Print</button>
  </div>
</body>
</html>`;
    res.set("Content-Type", "text/html; charset=utf-8").send(html);
  } catch (e) {
    next(e);
  }
});

export default router;

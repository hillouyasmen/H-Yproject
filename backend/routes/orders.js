// backend/routes/orders.js
import express from "express";
import { pool } from "../db.js";
import { sendMail } from "../utils/mailer.js";
import { buildInvoiceHTML } from "../utils/invoice.js";
import { emitEvent } from "./events.js";

const router = express.Router();

/* ===== Helpers ===== */
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// replace your getSettings with this
async function getSettings(connOrPool) {
  const defaults = {
    site_name: "H&Y Moda",
    tax_percent: 0,
    shipping_flat: 0,
    free_shipping_threshold: 0,
  };
  try {
    const [rows] = await connOrPool.query(
      `SELECT site_name, tax_percent, shipping_flat, free_shipping_threshold
         FROM settings
        WHERE id = 1`
    );
    if (!rows?.length) return defaults;
    const s = rows[0];
    return {
      site_name: s.site_name ?? defaults.site_name,
      tax_percent: Number(s.tax_percent ?? defaults.tax_percent),
      shipping_flat: Number(s.shipping_flat ?? defaults.shipping_flat),
      free_shipping_threshold: Number(
        s.free_shipping_threshold ?? defaults.free_shipping_threshold
      ),
    };
  } catch {
    return defaults;
  }
}

const colCache = new Map();
async function tableHasColumn(connOrPool, table, column) {
  const key = `${table}.${column}`;
  if (colCache.has(key)) return colCache.get(key);
  try {
    const [rows] = await connOrPool.query(
      `SHOW COLUMNS FROM \`${table}\` LIKE ?`,
      [column]
    );
    const ok = !!rows?.length;
    colCache.set(key, ok);
    return ok;
  } catch {
    colCache.set(key, false);
    return false;
  }
}

const tblCache = new Map();
async function tableExists(connOrPool, table) {
  if (tblCache.has(table)) return tblCache.get(table);
  try {
    const [rows] = await connOrPool.query(`SHOW TABLES LIKE ?`, [table]);
    const ok = !!rows?.length;
    tblCache.set(table, ok);
    return ok;
  } catch {
    tblCache.set(table, false);
    return false;
  }
}

async function emitLowStockIfNeeded(conn, product_id, color, size) {
  const threshold = Number(process.env.LOW_STOCK_THRESHOLD || 5);
  try {
    const [[row]] = await conn.query(
      `SELECT v.product_id, v.color, v.size, v.quantity, v.price, p.product_name
         FROM variations v
         JOIN products p ON p.product_id = v.product_id
        WHERE v.product_id=? AND v.color=? AND v.size=?`,
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
  } catch {}
}

/** membership discount */
function pctForPlan(plan) {
  const ANY = Number(process.env.MEMBER_PERCENT || 12);
  const M = Number(process.env.MEMBER_MONTHLY_PERCENT || ANY);
  const Y = Number(process.env.MEMBER_YEARLY_PERCENT || Math.max(ANY, M));
  if (!plan) return 0;
  const p = String(plan).toLowerCase();
  if (p === "monthly") return M;
  if (p === "yearly") return Y;
  return ANY;
}

/* ===== API ===== */

// send invoice
router.post("/:id/send-invoice", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { to } = req.body || {};
    const { html, toEmail, order } = await buildInvoiceHTML(id);
    const recipient = to || toEmail;
    if (!recipient)
      return res.status(400).json({ ok: false, message: "No email" });

    try {
      const info = await sendMail({
        to: recipient,
        subject: `Invoice #${order.order_id} - H&Y Moda`,
        html,
        text: `Invoice for order #${order.order_id}`,
      });
      return res.json({
        ok: true,
        messageId: info?.messageId || null,
        emailed: !info?.skipped,
      });
    } catch (mailErr) {
      console.warn("sendMail failed:", mailErr?.message);
      return res.json({
        ok: false,
        emailed: false,
        message: "mail_failed",
        detail: mailErr?.message,
      });
    }
  } catch (e) {
    next(e);
  }
});

// list orders (optional user_id filter)
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

// create order (applies membership discount)
router.post("/", async (req, res, next) => {
  let conn;
  try {
    const { user_id, items } = req.body;
    if (!user_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [[mem]] = await conn.query(
      `SELECT plan
         FROM memberships
        WHERE user_id=? AND status='active'
          AND NOW() BETWEEN start_date AND end_date
        ORDER BY end_date DESC
        LIMIT 1`,
      [user_id]
    );
    const plan = mem?.plan || null;
    const pct = pctForPlan(plan);

    async function getVarPrice(product_id, color, size) {
      const [vr] = await conn.query(
        `SELECT price FROM variations WHERE product_id=? AND color=? AND size=? LIMIT 1`,
        [product_id, color, size]
      );
      return vr.length ? Number(vr[0].price || 0) : null;
    }

    let total = 0;
    for (const it of items) {
      const price = await getVarPrice(it.product_id, it.color, it.size);
      if (price == null)
        throw Object.assign(new Error("Variation not found"), { status: 400 });
      const qty = Number(it.quantity || 0);
      const unit = pct ? price * (1 - pct / 100) : price;
      total += unit * qty;
    }

    const [ins] = await conn.query(
      `INSERT INTO orders (user_id, status, total_amount)
       VALUES (?, 'pending', ?)`,
      [user_id, round2(total)]
    );
    const order_id = ins.insertId;

    for (const it of items) {
      const [vr] = await conn.query(
        `SELECT price FROM variations WHERE product_id=? AND color=? AND size=? LIMIT 1`,
        [it.product_id, it.color, it.size]
      );
      if (!vr.length)
        throw Object.assign(new Error("Variation not found"), { status: 400 });
      const base = Number(vr[0].price || 0);
      const unit = pct ? base * (1 - pct / 100) : base;

      await conn.query(
        `INSERT INTO order_items (order_id, product_id, color, size, quantity, unit_price)
         VALUES (?,?,?,?,?,?)`,
        [order_id, it.product_id, it.color, it.size, it.quantity, round2(unit)]
      );

      await conn.query(
        `UPDATE variations
            SET quantity = GREATEST(quantity - ?, 0)
          WHERE product_id=? AND color=? AND size=?`,
        [it.quantity, it.product_id, it.color, it.size]
      );

      await emitLowStockIfNeeded(conn, it.product_id, it.color, it.size);
    }

    await conn.commit();
    emitEvent("order.created", {
      order_id,
      user_id,
      total_amount: round2(total),
    });

    res.json({
      ok: true,
      order_id,
      total_amount: round2(total),
      is_member: !!plan,
      member_discount_percent: pct,
      plan: plan || null,
    });
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

// update status
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!status)
      return res.status(400).json({ ok: false, message: "Missing status" });

    const allowed = new Set(["pending", "paid", "shipped", "cancelled"]);
    if (!allowed.has(String(status)))
      return res.status(400).json({ ok: false, message: "Invalid status" });

    const [r] = await pool.query(
      `UPDATE orders SET status=? WHERE order_id=?`,
      [status, id]
    );
    if (r.affectedRows === 0)
      return res.status(404).json({ ok: false, message: "Order not found" });

    emitEvent(`order.${status}`, { order_id: Number(id) });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// get details (يحسِب subtotal/tax/shipping/total من settings)
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const [orderRows] = await pool.query(
      `SELECT o.order_id, o.user_id, o.status, o.total_amount, o.order_date,
              u.username, u.email
         FROM orders o
         JOIN users u ON u.user_id = o.user_id
        WHERE o.order_id = ?`,
      [id]
    );
    if (!orderRows.length)
      return res.status(404).json({ message: "Order not found" });
    const order = orderRows[0];

    const hasUnit = await tableHasColumn(pool, "order_items", "unit_price");
    const priceExpr = hasUnit
      ? "COALESCE(oi.unit_price, v.price, 0)"
      : "COALESCE(v.price, 0)";

    const [itemRows] = await pool.query(
      `
      SELECT 
          oi.product_id, oi.color, oi.size, oi.quantity,
          ${priceExpr} AS unit_price,
          p.product_name, p.image_url
       FROM order_items oi
       JOIN products p ON p.product_id = oi.product_id
  LEFT JOIN variations v
         ON v.product_id = oi.product_id AND v.color = oi.color AND v.size = oi.size
      WHERE oi.order_id = ?
      `,
      [id]
    );

    const items = itemRows.map((r) => {
      const unit = Number(r.unit_price || 0);
      const qty = Number(r.quantity || 0);
      return { ...r, unit_price: unit, line_total: round2(unit * qty) };
    });

    const subtotal = round2(
      items.reduce((s, x) => s + Number(x.line_total || 0), 0)
    );

    // after you build `items` and `subtotal`
    const s = await getSettings(pool);

    const baseShipping = Number(s.shipping_flat || 0);
    const threshold = Number(s.free_shipping_threshold || 0);
    // free shipping only if threshold > 0 AND subtotal >= threshold
    const shipping = threshold > 0 && subtotal >= threshold ? 0 : baseShipping;

    const taxPct = Number(s.tax_percent || 0);
    const tax = round2(subtotal * (taxPct / 100));
    const grand_total = round2(subtotal + shipping + tax);

    res.json({
      order,
      items,
      summary: { subtotal, shipping, tax, grand_total },
    });
  } catch (e) {
    console.error("GET /api/orders/:id failed:", e?.message);
    next(e);
  }
});

/* ===== Payments misc (optional) ===== */
export const miscApi = express.Router();

// /api/payments/complete
miscApi.post("/payments/complete", async (req, res) => {
  const { payment_id, success, order_id } = req.body || {};
  if (!payment_id)
    return res.status(400).json({ ok: false, message: "Missing payment_id" });

  try {
    if (await tableExists(pool, "payments")) {
      await pool.query(
        `INSERT INTO payments (payment_id, success, order_id, created_at)
         VALUES (?,?,?, NOW())`,
        [String(payment_id), !!success, order_id || null]
      );
    }
  } catch (e) {
    console.warn("payments insert skipped:", e?.message);
  }

  if (success && order_id) {
    try {
      await pool.query(`UPDATE orders SET status='paid' WHERE order_id=?`, [
        order_id,
      ]);
      emitEvent("order.paid", { order_id: Number(order_id) });
    } catch (e) {
      console.warn("mark paid failed:", e?.message);
    }
  }

  res.json({ ok: true });
});

export default router;

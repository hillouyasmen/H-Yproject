// backend/utils/invoice.js
import { pool } from "../db.js";

export async function buildInvoiceHTML(orderId) {
  const [oRows] = await pool.query(
    `SELECT o.order_id, o.user_id, o.status, o.total_amount, o.order_date,
            u.username, u.email, u.address
       FROM orders o
       JOIN users u ON u.user_id = o.user_id
      WHERE o.order_id = ?`,
    [orderId]
  );
  if (!oRows.length) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }
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
    [orderId]
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

  return { html, toEmail: o.email || null, order: o };
}

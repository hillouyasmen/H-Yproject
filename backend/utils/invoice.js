// backend/utils/invoice.js
import { pool } from "../db.js";

// دالة بسيطة لتهريب النصوص حتى ما تكسر الـ HTML لو فيها علامات خاصة
function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function buildInvoiceHTML(orderId) {
  // اجلب بيانات الطلب + المستخدم
  const [oRows] = await pool.query(
    `SELECT o.order_id, o.user_id, o.status, o.total_amount, o.order_date,
            u.username, u.email, u.address
       FROM orders o
       JOIN users u ON u.user_id = o.user_id
      WHERE o.order_id = ?`,
    [orderId]
  );
  if (!oRows.length) {
    throw Object.assign(new Error("Order not found"), { status: 404 });
  }
  const o = oRows[0];

  // عناصر الطلب مع سعر الوحدة (fallback من variations)
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
    unit_price: Number(r.unit_price || 0),
    quantity: Number(r.quantity || 0),
    line_total: Number(r.unit_price || 0) * Number(r.quantity || 0),
  }));

  const subtotal = items.reduce((s, x) => s + x.line_total, 0);
  const shipping = 0;
  const tax = 0;
  const total = subtotal + shipping + tax;

  // HTML موحّد للطباعة والإيميل (بدون أزرار/JS)
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Invoice #${o.order_id} - H&Y Moda</title>
<style>
  :root{ --pink:#ff7ab8; --ink:#2e2e2e; --muted:#7a7a7a; }
  body{ font-family: Inter, Arial, sans-serif; color:var(--ink); margin:24px; background:#fff7fb; }
  .sheet{ width: 820px; max-width: 100%; margin:0 auto; background:#fff; padding:24px; border:1px solid #f2c6dc; border-radius:16px; }
  .head{ display:flex; justify-content:space-between; align-items:flex-start; gap:16px; }
  .brand{ color:#d63384; font-weight:900; font-size:1.4rem; }
  .muted{ color:var(--muted); }
  h2{ margin:.6rem 0 .2rem; }
  .badge{ display:inline-block; padding:6px 10px; border-radius:999px; color:#fff; background:#d63384; font-weight:800; font-size:.85rem; text-transform:capitalize; }
  table{ width:100%; border-collapse:collapse; margin-top:16px; }
  th, td{ padding:10px; text-align:left; border-bottom:1px solid #f4d7e6; vertical-align:top; }
  th{ background:#fff1f7; font-weight:900; }
  .right{ text-align:right; }
  .totals{ width: 340px; margin-left:auto; margin-top:10px; }
  .totals th, .totals td{ border-bottom:none; }
  .totals .grand th, .totals .grand td{ border-top:2px solid #f4d7e6; padding-top:12px; font-size:1.02rem; }
  @media print{ body{ margin:0; } .sheet{ border:none; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <div class="brand">H&Y Moda</div>
        <div class="muted">Invoice #${o.order_id}</div>
        <div class="muted">${esc(new Date(o.order_date).toLocaleString())}</div>
      </div>
      <div>
        <div><b>Bill To</b></div>
        <div>${esc(o.username)}</div>
        ${o.email ? `<div class="muted">${esc(o.email)}</div>` : ""}
        ${o.address ? `<div class="muted">${esc(o.address)}</div>` : ""}
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:10px;justify-content:space-between;margin-top:6px;">
      <h2>Payment Invoice</h2>
      <span class="badge">${esc(o.status || "pending")}</span>
    </div>

    <table aria-label="Items">
      <thead>
        <tr>
          <th>Product</th>
          <th>Color</th>
          <th>Size</th>
          <th class="right">Qty</th>
          <th class="right">Unit</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map((r) =>
            `
          <tr>
            <td>${esc(r.product_name)}</td>
            <td>${esc(r.color)}</td>
            <td>${esc(r.size)}</td>
            <td class="right">${r.quantity}</td>
            <td class="right">$${r.unit_price.toFixed(2)}</td>
            <td class="right">$${r.line_total.toFixed(2)}</td>
          </tr>
        `.trim()
          )
          .join("")}
      </tbody>
    </table>

    <table class="totals" aria-label="Totals">
      <tbody>
        <tr><td>Subtotal</td><td class="right">$${subtotal.toFixed(2)}</td></tr>
        <tr><td>Shipping</td><td class="right">$${shipping.toFixed(2)}</td></tr>
        <tr><td>Tax</td><td class="right">$${tax.toFixed(2)}</td></tr>
        <tr class="grand"><th>Total</th><th class="right">$${total.toFixed(
          2
        )}</th></tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;

  // نرجّع HTML + بريد المستلم + بيانات مفيدة
  return {
    html,
    toEmail: o.email,
    order: o,
    // (اختياري) للي يحتاجها مستقبلاً:
    // items,
    // summary: { subtotal, shipping, tax, grand_total: total },
  };
}

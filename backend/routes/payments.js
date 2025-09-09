// backend/routes/payments.js
import express from 'express';
import { pool } from '../db.js';
import { emitEvent } from './events.js';

const router = express.Router();
const round2 = n => Math.round((Number(n) || 0) * 100) / 100;

/* ---------- helpers ---------- */

async function getSettings(conn) {
  // Use new columns, fall back defensively if needed
  try {
    const [rows] = await conn.query(
      `SELECT site_name, tax_percent, shipping_flat, free_shipping_threshold
         FROM settings WHERE id = 1`,
    );
    if (rows.length) {
      const s = rows[0];
      return {
        site_name: s.site_name ?? 'H&Y Moda',
        tax_percent: Number(s.tax_percent ?? 0),
        shipping_flat: Number(s.shipping_flat ?? 0),
        free_shipping_threshold: Number(s.free_shipping_threshold ?? 0),
      };
    }
  } catch {}
  return {
    site_name: 'H&Y Moda',
    tax_percent: 0,
    shipping_flat: 0,
    free_shipping_threshold: 0,
  };
}

// membership discount
function pctForPlan(plan) {
  const ANY = Number(process.env.MEMBER_PERCENT || 12);
  const M = Number(process.env.MEMBER_MONTHLY_PERCENT || ANY);
  const Y = Number(process.env.MEMBER_YEARLY_PERCENT || Math.max(ANY, M));
  if (!plan) return 0;
  const p = String(plan).toLowerCase();
  if (p === 'monthly') return M;
  if (p === 'yearly') return Y;
  return ANY; // trial & others
}

async function getUserActivePlan(conn, user_id) {
  const [[mem]] = await conn.query(
    `SELECT plan
       FROM memberships
      WHERE user_id=? AND status='active'
        AND NOW() BETWEEN start_date AND end_date
      ORDER BY end_date DESC
      LIMIT 1`,
    [user_id],
  );
  return mem?.plan || null;
}

async function fetchVarPrice(conn, product_id, color, size) {
  const [r] = await conn.query(
    `SELECT price FROM variations
      WHERE product_id=? AND color=? AND size=? LIMIT 1`,
    [product_id, color, size],
  );
  return r.length ? Number(r[0].price || 0) : null;
}

async function fetchProdInfo(conn, product_id) {
  const [[p]] = await conn.query(
    `SELECT product_name, image_url FROM products WHERE product_id=? LIMIT 1`,
    [product_id],
  );
  return p || { product_name: 'Product', image_url: null };
}

async function computeCartSummary(conn, user_id, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw Object.assign(new Error('No items'), { status: 400 });
  }

  const plan = await getUserActivePlan(conn, user_id);
  const pct = pctForPlan(plan);

  const detailed = [];
  let subtotal = 0;

  for (const it of items) {
    const { product_id, color, size, quantity } = it || {};
    const qty = Number(quantity || 0);
    if (!product_id || !color || !size || qty <= 0) {
      throw Object.assign(new Error('Invalid item'), { status: 400 });
    }

    const base = await fetchVarPrice(conn, product_id, color, size);
    if (base == null) {
      throw Object.assign(new Error('Variation not found'), { status: 400 });
    }
    const unit = pct ? base * (1 - pct / 100) : base;
    const line_total = round2(unit * qty);

    const info = await fetchProdInfo(conn, product_id);

    subtotal += line_total;
    detailed.push({
      product_id,
      color,
      size,
      quantity: qty,
      unit_price: round2(unit),
      line_total,
      product_name: info.product_name,
      image_url: info.image_url,
    });
  }

  subtotal = round2(subtotal);

  const s = await getSettings(conn);
  const baseShip = Number(s.shipping_flat || 0);
  const threshold = Number(s.free_shipping_threshold || 0);
  const shipping = threshold > 0 && subtotal >= threshold ? 0 : baseShip;

  const tax = round2(subtotal * (Number(s.tax_percent || 0) / 100));
  const grand_total = round2(subtotal + shipping + tax);

  return {
    plan,
    member_discount_percent: pct,
    items: detailed,
    summary: {
      subtotal,
      shipping: round2(shipping),
      tax,
      grand_total,
    },
  };
}

async function emitLowStockIfNeeded(conn, product_id, color, size) {
  const threshold = Number(process.env.LOW_STOCK_THRESHOLD || 5);
  try {
    const [[row]] = await conn.query(
      `SELECT v.product_id, v.color, v.size, v.quantity, v.price, p.product_name
         FROM variations v
         JOIN products p ON p.product_id = v.product_id
        WHERE v.product_id=? AND v.color=? AND v.size=?`,
      [product_id, color, size],
    );
    if (row && Number(row.quantity) <= threshold) {
      emitEvent('stock.low', {
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

/* ---------- API ---------- */

/**
 * POST /api/payments/quote
 * body: { user_id, items:[{product_id,color,size,quantity}] }
 * returns: { items:[... with unit_price/line_total], summary:{...}, plan, member_discount_percent }
 */
router.post('/quote', async (req, res, next) => {
  const { user_id, items } = req.body || {};
  if (!user_id)
    return res.status(400).json({ ok: false, message: 'Missing user_id' });

  const conn = await pool.getConnection();
  try {
    const quote = await computeCartSummary(conn, user_id, items);
    res.json({ ok: true, ...quote });
  } catch (e) {
    const status = e?.status || 500;
    res
      .status(status)
      .json({ ok: false, message: e?.message || 'quote_failed' });
  } finally {
    try {
      conn.release();
    } catch {}
  }
});

/**
 * POST /api/payments/finalize
 * body: { user_id, items, payment_id }
 * server recomputes summary, creates an order as 'paid', inserts items, deducts stock
 */
router.post('/finalize', async (req, res, next) => {
  const { user_id, items, payment_id } = req.body || {};
  if (!user_id)
    return res.status(400).json({ ok: false, message: 'Missing user_id' });
  if (!payment_id)
    return res.status(400).json({ ok: false, message: 'Missing payment_id' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // recompute (secure)
    const {
      plan,
      member_discount_percent,
      items: detailed,
      summary,
    } = await computeCartSummary(conn, user_id, items);

    // create PAID order with final total
    const [ins] = await conn.query(
      `INSERT INTO orders (user_id, status, total_amount)
       VALUES (?, 'paid', ?)`,
      [user_id, round2(summary.grand_total)],
    );
    const order_id = ins.insertId;

    // insert items & deduct stock
    for (const it of detailed) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, color, size, quantity, unit_price)
         VALUES (?,?,?,?,?,?)`,
        [
          order_id,
          it.product_id,
          it.color,
          it.size,
          it.quantity,
          round2(it.unit_price),
        ],
      );

      await conn.query(
        `UPDATE variations
            SET quantity = GREATEST(quantity - ?, 0)
          WHERE product_id=? AND color=? AND size=?`,
        [it.quantity, it.product_id, it.color, it.size],
      );

      await emitLowStockIfNeeded(conn, it.product_id, it.color, it.size);
    }

    // optional: record payment if a table exists
    try {
      await conn.query(
        `CREATE TABLE IF NOT EXISTS payments (
           id INT AUTO_INCREMENT PRIMARY KEY,
           payment_id VARCHAR(128) NOT NULL,
           success TINYINT(1) NOT NULL DEFAULT 1,
           order_id INT NULL,
           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         )`,
      );
      await conn.query(
        `INSERT INTO payments (payment_id, success, order_id)
         VALUES (?,?,?)`,
        [String(payment_id), 1, order_id],
      );
    } catch (e) {
      // ignore
    }

    await conn.commit();

    emitEvent('order.paid', {
      order_id,
      user_id,
      payment_id,
      total_amount: summary.grand_total,
      subtotal: summary.subtotal,
      shipping: summary.shipping,
      tax: summary.tax,
      is_member: !!plan,
      member_discount_percent,
      plan: plan || null,
    });

    res.json({
      ok: true,
      order_id,
      summary,
    });
  } catch (e) {
    try {
      await conn.rollback();
    } catch {}
    next(e);
  } finally {
    try {
      conn.release();
    } catch {}
  }
});

export default router;

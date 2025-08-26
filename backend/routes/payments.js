import express from "express";
import { pool } from "../db.js";
import { emitEvent } from "./events.js";

const router = express.Router();

const PLAN_PRICES = { trial: 0, monthly: 14.99, yearly: 129.0 };

async function computeOrderAmount(order_id) {
  const [[ord]] = await pool.query(
    `SELECT user_id FROM orders WHERE order_id=?`,
    [order_id]
  );
  if (!ord) throw Object.assign(new Error("Order not found"), { status: 404 });

  const [[row]] = await pool.query(
    `SELECT SUM(
        (CASE
           WHEN (oi.unit_price IS NULL OR oi.unit_price = 0)
           THEN COALESCE(v.price, 0)
           ELSE oi.unit_price
         END) * oi.quantity
       ) AS total
     FROM order_items oi
 LEFT JOIN variations v
        ON v.product_id = oi.product_id
       AND v.color      = oi.color
       AND v.size       = oi.size
    WHERE oi.order_id = ?`,
    [order_id]
  );

  return { user_id: ord.user_id, total: Number(row?.total || 0) };
}

/** POST /api/payments/create-session  { order_id? , plan? , currency? } */
router.post("/create-session", async (req, res, next) => {
  try {
    const { order_id = null, plan = null, currency = "USD" } = req.body || {};
    let amount = 0;

    if (order_id) {
      const r = await computeOrderAmount(order_id);
      amount = r.total;
    } else if (plan) {
      amount = PLAN_PRICES[plan] ?? 0;
    }

    // أنشئ Session ID بسيط للتجربة
    const sessionId = "sess_" + Math.random().toString(36).slice(2, 10);
    res.json({ ok: true, sessionId, amount, currency });
  } catch (e) {
    next(e);
  }
});

/** POST /api/payments/complete */
router.post("/complete", async (req, res, next) => {
  try {
    const {
      payment_id,
      success,
      user_id = null,
      plan = null,
      bodyshape_id = null,
      order_id = null,
      currency = "USD",
    } = req.body || {};

    if (!payment_id || typeof success === "undefined") {
      return res
        .status(400)
        .json({ ok: false, message: "payment_id or success missing" });
    }

    const status = success ? "succeeded" : "failed";
    let amount = null;
    let _user_id = user_id;
    let _plan = plan;

    if (order_id) {
      const r = await computeOrderAmount(order_id);
      amount = r.total;
      _user_id = _user_id ?? r.user_id;
      _plan = null;
    } else if (_plan) {
      amount = PLAN_PRICES[_plan] ?? 0;
    }

    await pool.query(
      `INSERT INTO payments
         (payment_id, user_id, plan, amount, currency, status, bodyshape_id, order_id, completed_at)
       VALUES
         (?, ?, ?, COALESCE(?,0), ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         user_id       = COALESCE(VALUES(user_id),user_id),
         plan          = COALESCE(VALUES(plan),plan),
         amount        = COALESCE(VALUES(amount),amount),
         currency      = COALESCE(VALUES(currency),currency),
         status        = VALUES(status),
         bodyshape_id  = COALESCE(VALUES(bodyshape_id),bodyshape_id),
         order_id      = COALESCE(VALUES(order_id),order_id),
         completed_at  = NOW()`,
      [
        payment_id,
        _user_id,
        _plan,
        amount,
        currency,
        status,
        bodyshape_id,
        order_id,
      ]
    );

    if (success && order_id) {
      await pool.query(`UPDATE orders SET status='paid' WHERE order_id=?`, [
        order_id,
      ]);
      emitEvent("order.paid", {
        order_id,
        user_id: _user_id || null,
        amount,
        currency,
      });
    }

    res.json({
      ok: true,
      payment_id,
      status,
      amount,
      order_id,
      plan: _plan,
      currency,
    });
  } catch (e) {
    next(e);
  }
});

export default router;

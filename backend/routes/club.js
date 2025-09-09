// backend/routes/club.js
import express from "express";
import { pool } from "../db.js";
import { sendMail } from "../utils/mailer.js";

const router = express.Router();

const PRICING = {
  trial: 0,
  monthly: 14.99,
  yearly: 129.0,
};
const DAYS = {
  trial: 7,
  monthly: 30,
  yearly: 365,
};

/** GET /api/club?user_id= */
router.get("/", async (req, res, next) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ message: "user_id required" });

    const [[user]] = await pool.query(
      `SELECT user_id, username, email, bodyshape_id FROM users WHERE user_id=?`,
      [user_id]
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const [mRows] = await pool.query(
      `SELECT * FROM memberships 
        WHERE user_id=? AND status='active' 
        ORDER BY start_date DESC 
        LIMIT 1`,
      [user_id]
    );

    const [[trialRow]] = await pool.query(
      `SELECT COUNT(*) AS c FROM memberships 
        WHERE user_id=? AND plan='trial'`,
      [user_id]
    );
    const trial_used = Number(trialRow?.c || 0) > 0;

    res.json({
      user,
      membership: mRows[0] || null,
      trial_used, // ←
    });
  } catch (e) {
    next(e);
  }
});

/** POST /api/club  { user_id, bodyshape_id, plan }   */
router.post("/", async (req, res, next) => {
  let conn;
  try {
    const { user_id, bodyshape_id, plan } = req.body;
    if (
      !user_id ||
      !bodyshape_id ||
      !["trial", "monthly", "yearly"].includes(String(plan))
    ) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [[u]] = await conn.query(
      `SELECT bodyshape_id, email, username FROM users WHERE user_id=?`,
      [user_id]
    );
    const finalBodyshape = u?.bodyshape_id || bodyshape_id;

    if (!u?.bodyshape_id) {
      await conn.query(`UPDATE users SET bodyshape_id=? WHERE user_id=?`, [
        finalBodyshape,
        user_id,
      ]);
    }

    if (plan === "trial") {
      const [[trialRow]] = await conn.query(
        `SELECT COUNT(*) AS c FROM memberships WHERE user_id=? AND plan='trial'`,
        [user_id]
      );
      if (Number(trialRow?.c || 0) > 0) {
        await conn.rollback();
        return res.status(409).json({ message: "Free trial already used" });
      }

      const [[active]] = await conn.query(
        `SELECT membership_id FROM memberships WHERE user_id=? AND status='active' LIMIT 1`,
        [user_id]
      );
      if (active) {
        await conn.rollback();
        return res
          .status(409)
          .json({ message: "You already have an active membership" });
      }
    } else {
      await conn.query(
        `UPDATE memberships SET status='cancelled' 
           WHERE user_id=? AND status='active'`,
        [user_id]
      );
    }

    const price = PRICING[plan];
    const days = DAYS[plan];

    const [[{ now }]] = await conn.query(`SELECT NOW() AS now`);
    const [[{ end_at }]] = await conn.query(
      `SELECT DATE_ADD(NOW(), INTERVAL ? DAY) AS end_at`,
      [days]
    );

    const [ins] = await conn.query(
      `INSERT INTO memberships (user_id, plan, price, start_date, end_date, status)
       VALUES (?,?,?,?,?,'active')`,
      [user_id, plan, price, now, end_at]
    );

    await conn.commit();

    if (u?.email) {
      const nice = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
      await sendMail({
        to: u.email,
        subject: `Welcome to H&Y Moda Club – ${nice(plan)} plan`,
        html: `
          <div style="font-family:Inter,Arial;padding:16px">
            <h2 style="color:#d63384;margin:0 0 8px">Welcome, ${
              u.username || "Lovely"
            }</h2>
            <p>You joined the <b>${nice(
              plan
            )}</b> plan. Your bodyshape preference is saved – enjoy personalized offers 🌸</p>
            <ul>
              <li>Plan: <b>${plan}</b></li>
              <li>Price: <b>$${price.toFixed(2)}</b></li>
              <li>Valid until: <b>${new Date(
                end_at
              ).toLocaleDateString()}</b></li>
            </ul>
            <p>Happy shopping! 💖</p>
          </div>
        `,
        text: `Welcome to H&Y Moda Club. Plan: ${plan}, Price: $${price.toFixed(
          2
        )}, Ends: ${new Date(end_at).toLocaleDateString()}`,
      });
    }

    res.json({
      ok: true,
      membership_id: ins.insertId,
      plan,
      price,
      start_date: now,
      end_date: end_at,
      bodyshape_id: finalBodyshape,
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

/** PUT /api/club/cancel  { user_id } */
router.put("/cancel", async (req, res, next) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ message: "user_id required" });

    await pool.query(
      `UPDATE memberships SET status='cancelled' WHERE user_id=? AND status='active'`,
      [user_id]
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

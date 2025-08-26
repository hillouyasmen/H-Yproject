import { Router } from "express";
import crypto from "crypto";
import { pool as db } from "../db.js";
import { sendMail } from "../utils/mailer.js";
import bcrypt from "bcrypt";

const router = Router();

/**
 * POST /api/auth/request-reset
 * body: { email }
 */
router.post("/request-reset", async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "email is required" });

    // find user
    const [users] = await db.query(
      "SELECT user_id, email, username FROM users WHERE email = ?",
      [email]
    );
    if (!users.length) {
      // لأسباب أمنية نرجع ok حتى لو الإيميل غير موجود
      return res.json({ ok: true });
    }

    const user = users[0];
    const token = crypto.randomBytes(32).toString("hex");
    const ttl = Number(process.env.RESET_TOKEN_TTL_MINUTES || 30);
    const expires = new Date(Date.now() + ttl * 60 * 1000);

    // store token
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
      [user.user_id, token, expires]
    );

    const resetUrl = `${
      process.env.CLIENT_URL || "http://localhost:5173"
    }/reset?token=${token}`;
    const subject = "Reset your H&Y Moda password";
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2 style="color:#d63384">H&Y Moda</h2>
        <p>Hello ${user.username || ""},</p>
        <p>We received a request to reset your password. Click the button below:</p>
        <p>
          <a href="${resetUrl}"
             style="background:#d63384;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;font-weight:800">
             Reset Password
          </a>
        </p>
        <p>Or copy this link:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color:#888">This link expires in ${ttl} minutes. If you didn't request it, you can ignore this email.</p>
      </div>
    `;

    await sendMail({
      to: user.email,
      subject,
      html,
      text: `Reset: ${resetUrl}`,
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/reset
 * body: { token, password }
 */
router.post("/reset", async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "token and password are required" });
    }
    // find token
    const [rows] = await db.query(
      `SELECT prt.*, u.user_id FROM password_reset_tokens prt
        JOIN users u ON u.user_id = prt.user_id
       WHERE prt.token = ? AND prt.used = 0 AND prt.expires_at > NOW()`,
      [token]
    );
    if (!rows.length) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const rec = rows[0];
    const hash = await bcrypt.hash(password, 12);

    // update password
    await db.query(`UPDATE users SET password_hash = ? WHERE user_id = ?`, [
      hash,
      rec.user_id,
    ]);
    // mark token used
    await db.query(`UPDATE password_reset_tokens SET used = 1 WHERE id = ?`, [
      rec.id,
    ]);

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

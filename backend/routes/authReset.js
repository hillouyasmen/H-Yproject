// backend/routes/authReset.js
import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { sendMail } from "../utils/mailer.js";

const router = express.Router();

const {
  APP_NAME = "H&Y Moda",
  APP_URL = "http://localhost:5173",
  RESET_TOKEN_TTL_MINUTES = "30",
  BCRYPT_ROUNDS = "10",
  MAIL_FROM = "no-reply@hy-moda.local",
} = process.env;

async function ensureResetsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (token_hash),
      INDEX (user_id),
      CONSTRAINT fk_resets_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}
ensureResetsTable().catch(console.error);

/** POST /api/auth/request-reset { email } */
router.post("/request-reset", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    if (!email)
      return res.status(400).json({ ok: false, message: "Email is required" });

    const [rows] = await pool.query(
      `SELECT user_id, username, email FROM users WHERE LOWER(email)=? LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.json({ ok: true, sent: true });
    }

    const user = rows[0];

    const raw = crypto.randomBytes(32).toString("hex"); // التوكن اللي بنرسله
    const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");

    const ttlMin = Math.max(5, Number(RESET_TOKEN_TTL_MINUTES) || 30);
    const [r] = await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
      [user.user_id, tokenHash, ttlMin]
    );

    const resetLink = `${APP_URL.replace(/\/+$/, "")}/reset?token=${raw}`;

    // رسالة HTML جميلة + نص بديل
    const subject = `Reset your password — ${APP_NAME}`;
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.7;color:#222">
        <h2 style="margin:0 0 10px;">إعادة تعيين كلمة المرور</h2>
        <p>مرحبًا ${user.username || ""}،</p>
        <p>وصلنا طلب لإعادة تعيين كلمة المرور لحسابك في <b>${APP_NAME}</b>.</p>
        <p>اضغط الزر التالي لتعيين كلمة مرور جديدة:</p>
        <p>
          <a href="${resetLink}"
             style="display:inline-block;background:#d63384;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700">
            تعيين كلمة مرور جديدة
          </a>
        </p>
        <p style="color:#666">
          هذا الرابط صالح لمدة <b>${ttlMin} دقيقة</b>. إذا لم تطلب ذلك، تجاهل هذا البريد.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
        <p style="font-size:12px;color:#666">رابط بديل: <br />
          <a href="${resetLink}">${resetLink}</a>
        </p>
      </div>
    `;
    const text = [
      `إعادة تعيين كلمة المرور - ${APP_NAME}`,
      ``,
      `مرحبًا ${user.username || ""},`,
      `وصلنا طلب لإعادة تعيين كلمة المرور لحسابك.`,
      `الرابط (صالح ${ttlMin} دقيقة):`,
      resetLink,
      ``,
      `إذا لم تطلب ذلك فتجاهل الرسالة.`,
    ].join("\n");

    try {
      await sendMail({ to: user.email, subject, html, text, from: MAIL_FROM });
    } catch (mailErr) {
      // لا نفصح عن فشل الإيميل للعميل بشكل دقيق (حماية)
      console.warn("reset email send failed:", mailErr?.message);
    }

    res.json({ ok: true, sent: true });
  } catch (e) {
    next(e);
  }
});

/** POST /api/auth/reset { token, password } */
router.post("/reset", async (req, res, next) => {
  let conn;
  try {
    const { token, password } = req.body || {};
    if (!token || !password || String(password).length < 6) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid token or weak password" });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(String(token))
      .digest("hex");

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [[reset]] = await conn.query(
      `SELECT pr.id, pr.user_id, pr.expires_at, pr.used_at, u.email, u.username
         FROM password_resets pr
         JOIN users u ON u.user_id = pr.user_id
        WHERE pr.token_hash=? FOR UPDATE`,
      [tokenHash]
    );

    if (!reset) {
      await conn.rollback();
      return res
        .status(400)
        .json({ ok: false, message: "Invalid or expired token" });
    }
    if (reset.used_at) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "Token already used" });
    }
    if (new Date(reset.expires_at).getTime() < Date.now()) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "Token expired" });
    }

    // حدّث كلمة المرور (bcrypt)
    const hashed = await bcrypt.hash(
      String(password),
      Number(BCRYPT_ROUNDS) || 10
    );
    await conn.query(`UPDATE users SET password=? WHERE user_id=?`, [
      hashed,
      reset.user_id,
    ]);
    await conn.query(`UPDATE password_resets SET used_at=NOW() WHERE id=?`, [
      reset.id,
    ]);

    await conn.commit();

    // (اختياري) أرسل إيميل تأكيد التغيير
    try {
      const subject = `Your password was changed — ${APP_NAME}`;
      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.7;color:#222">
          <h2 style="margin:0 0 10px;">تم تغيير كلمة مرورك</h2>
          <p>مرحبًا ${reset.username || ""}،</p>
          <p>نؤكد لك أنه تم تغيير كلمة المرور لحسابك في <b>${APP_NAME}</b>.</p>
          <p>لو لم تكن أنت من قام بذلك، الرجاء التواصل معنا فورًا.</p>
        </div>
      `;
      const text = `تم تغيير كلمة المرور الخاصة بحسابك في ${APP_NAME}. إذا لم تكن أنت من قام بذلك، تواصل معنا فورًا.`;
      await sendMail({ to: reset.email, subject, html, text, from: MAIL_FROM });
    } catch (mailErr) {
      console.warn("password changed email failed:", mailErr?.message);
    }

    res.json({ ok: true });
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

export default router;

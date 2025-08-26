// backend/routes/users.js
import { Router } from "express";
import { pool } from "../db.js";
import { emitEvent } from "./events.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

const r = Router();

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM = "no-reply@hy-moda.local",
  ADMIN_EMAIL, // اختياري: BCC للأدمن
  APP_NAME = "H&Y Moda",
  APP_URL = "http://localhost:5173",
  JWT_SECRET = "devsecret",
  JWT_EXPIRES = "7d",
} = process.env;

/* ================== إعداد الإيميل (اختياري) ================== */
let transporter = null;
if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendWelcomeEmail({ to, username }) {
  if (!transporter) return;
  const subject = `Welcome to ${APP_NAME} 🎉`;
  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.7;color:#222">
    <h2 style="margin:0 0 10px;">Welcome, ${username}!</h2>
    <p>We're happy you joined <b>${APP_NAME}</b> 🤍</p>
    <p>
      <a href="${APP_URL}" style="display:inline-block;background:#d63384;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px">
        Visit ${APP_NAME}
      </a>
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
    <p style="font-size:12px;color:#666">If you didn’t sign up, please ignore this email.</p>
  </div>`;
  const text = `Welcome, ${username}!\n\nThanks for joining ${APP_NAME}.\nOpen: ${APP_URL}\n\nIf you didn’t sign up, ignore this email.`;
  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject,
    html,
    text,
    bcc: ADMIN_EMAIL || undefined,
  });
}

/* ================== Auth Endpoints ================== */
// POST /api/users/login  (username + password)
r.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "username & password required" });
    }
    const [rows] = await pool.query(
      `SELECT user_id, username, email, role, bodyshape_id
         FROM users
        WHERE username=? AND password=?
        LIMIT 1`,
      [username, password]
    );
    if (!rows.length) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid credentials" });
    }
    const user = rows[0];

    // 👇 إضافة JWT (مهم عشان req.user يتعبّى ويُسمح للأدمن)
    const token = jwt.sign(
      { sub: user.user_id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({ ok: true, user, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: "login_failed" });
  }
});

// GET /api/users/me (حالياً null لتبسيط)
r.get("/me", async (_req, res) => {
  res.json(null);
});

// POST /api/users/logout
r.post("/logout", (_req, res) => res.json({ ok: true }));

/* ================== Users CRUD ================== */

// GET all users (+ shape name)
r.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.*, b.shape_name
         FROM users u
         LEFT JOIN bodyshapes b ON u.bodyshape_id=b.bodyshape_id
       ORDER BY u.user_id`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "list_users_failed" });
  }
});

// CREATE user (بدون hashing لأغراض التجربة)
r.post("/", async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      phone,
      birth_date,
      role,
      address,
      bodyshape_id,
    } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    const [rs] = await pool.query(
      `INSERT INTO users(username,password,email,phone,birth_date,role,address,bodyshape_id)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        username,
        password,
        email,
        phone || null,
        birth_date || null,
        role || "customer",
        address || null,
        bodyshape_id || null,
      ]
    );

    const payload = { user_id: rs.insertId, username, email };

    // بثّ حدث إنشاء مستخدم
    emitEvent("user.created", payload);

    // إرسال الإيميل الترحيبي (اختياري)
    try {
      await sendWelcomeEmail({ to: email, username });
    } catch (err) {
      console.warn("Welcome email failed:", err?.message);
    }

    res.json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "create_user_failed" });
  }
});

// UPDATE user
r.put("/:id", async (req, res) => {
  try {
    const { username, email, phone, birth_date, role, address, bodyshape_id } =
      req.body;
    await pool.query(
      `UPDATE users
          SET username=?, email=?, phone=?, birth_date=?, role=?, address=?, bodyshape_id=?
        WHERE user_id=?`,
      [
        username,
        email,
        phone || null,
        birth_date || null,
        role || "customer",
        address || null,
        bodyshape_id || null,
        req.params.id,
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "update_user_failed" });
  }
});

// DELETE user
r.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE user_id=?", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "delete_user_failed" });
  }
});

export default r;

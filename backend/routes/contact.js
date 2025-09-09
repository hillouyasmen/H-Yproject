// backend/routes/contact.js
import express from "express";
import { pool } from "../db.js";
import nodemailer from "nodemailer";
import { emitEvent } from "./events.js";

const router = express.Router();

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  ADMIN_EMAIL,
  MAIL_FROM = "no-reply@hy-moda.local",
} = process.env;

/* ===== Mailer (optional) ===== */
let transporter = null;
if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim());
}

/* ===== CREATE message =====
   POST /api/contact
   body: { name, email, subject, message, user_id? }
*/
router.post("/", async (req, res, next) => {
  try {
    const { name, email, subject, message, user_id = null } = req.body || {};
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ ok: false, message: "Missing fields" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, message: "Invalid email" });
    }

    const [r] = await pool.query(
      `INSERT INTO contact_messages (user_id, name, email, subject, message)
       VALUES (?, ?, ?, ?, ?)`,
      [
        user_id ?? null,
        String(name).trim(),
        String(email).trim(),
        String(subject).trim(),
        String(message).trim(),
      ]
    );

    emitEvent("contact.created", {
      id: r.insertId,
      name,
      email,
      subject,
    });

    if (transporter && ADMIN_EMAIL) {
      await transporter.sendMail({
        from: MAIL_FROM,
        to: ADMIN_EMAIL,
        subject: `[Contact] ${subject}`,
        html: `<div style="font-family:Arial;line-height:1.5">
                 <h3>New Contact Message</h3>
                 <p><b>From:</b> ${name} &lt;${email}&gt;</p>
                 <p><b>Subject:</b> ${subject}</p>
                 <hr/>
                 <pre style="white-space:pre-wrap;font:inherit;">${message}</pre>
                 <hr/>
                 <small>ID: #${r.insertId}</small>
               </div>`,
        replyTo: `${name} <${email}>`,
      });
    }

    res.json({ ok: true, id: r.insertId });
  } catch (e) {
    next(e);
  }
});

/* ===== LIST messages (admin) =====
   GET /api/contact?status=open|resolved|all
*/
router.get("/", async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ ok: false, message: "Admins only" });
    }
    const status = String(req.query.status || "").toLowerCase();
    const allowed = status === "open" || status === "resolved";
    const where = allowed ? "WHERE status=?" : "";
    const params = allowed ? [status] : [];

    const [rows] = await pool.query(
      `SELECT id, user_id, name, email, subject, message, status, admin_note, created_at, resolved_at
         FROM contact_messages
         ${where}
         ORDER BY created_at DESC
         LIMIT 200`,
      params
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/* ===== UPDATE message (admin) =====
   PUT /api/contact/:id
   body: { status?: "open"|"resolved", admin_note?: string }
*/
router.put("/:id", async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ ok: false, message: "Admins only" });
    }
    const { id } = req.params;
    const { status, admin_note } = req.body || {};
    const allowed = new Set(["open", "resolved"]);

    await pool.query(
      `UPDATE contact_messages
          SET status       = COALESCE(?, status),
              admin_note   = COALESCE(?, admin_note),
              resolved_at  = CASE WHEN ?='resolved' THEN NOW() ELSE resolved_at END
        WHERE id = ?`,
      [
        allowed.has(status) ? status : null,
        admin_note ?? null,
        status ?? "",
        id,
      ]
    );

    emitEvent("contact.updated", {
      id: Number(id),
      status: allowed.has(status) ? status : undefined,
    });
    if (status === "resolved") {
      emitEvent("contact.resolved", { id: Number(id) });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

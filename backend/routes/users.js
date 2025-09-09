// backend/routes/users.js
import { Router } from "express";
import { pool } from "../db.js";
import { emitEvent } from "./events.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { sendMail, isMailEnabled } from "../utils/mailer.js";
import { buildMemberCardSVG, buildMemberCardHTML } from "../utils/userCard.js";

const r = Router();

const {
  APP_NAME = "H&Y Moda",
  APP_URL = "http://localhost:5173",
  ADMIN_EMAIL,
  JWT_SECRET = "devsecret",
  JWT_EXPIRES = "7d",
  BCRYPT_ROUNDS = "10",
  MIGRATE_PLAIN_TO_BCRYPT = "1",
} = process.env;

// ===== helpers =====
async function sendWelcomeEmail({ to, username }) {
  if (!isMailEnabled) return;
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
  await sendMail({ to, subject, html, text, bcc: ADMIN_EMAIL || undefined });
}

const strip = (u) => {
  if (!u) return u;
  const { password, ...rest } = u;
  return rest;
};

/* ===================== Auth ===================== */
// backend/routes/users.js (داخل r.post("/login", ...))
r.post("/login", async (req, res) => {
  try {
    const { username, email, identifier, password } = req.body || {};
    const rawId = (identifier || username || email || "").trim();
    const pass = String(password ?? "");

    if (!rawId || !pass) {
      return res
        .status(400)
        .json({ ok: false, message: "identifier & password required" });
    }

    // إذا شكله إيميل، خليه lowercase للمقارنة
    const isEmail = rawId.includes("@");
    const id = isEmail ? rawId.toLowerCase() : rawId;

    const [rows] = await pool.query(
      `
      SELECT user_id, username, email, role, bodyshape_id, password
        FROM users
       WHERE username = ?
          OR LOWER(email) = ?
       LIMIT 1
      `,
      [id, id]
    );

    if (!rows.length) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid credentials" });
    }

    const row = rows[0];
    const stored = String(row.password || "");
    const isBcrypt =
      stored.startsWith("$2a$") ||
      stored.startsWith("$2b$") ||
      stored.startsWith("$2y$");

    // جرّب الكلمة كما هي وكمان بعد trim لتفادي مسافات بالخطأ وقت التسجيل
    const attempts = [pass];
    if (pass.trim() !== pass) attempts.push(pass.trim());

    let ok = false;
    let matchedPlain = null;

    for (const attempt of attempts) {
      if (isBcrypt) {
        if (await bcrypt.compare(attempt, stored)) {
          ok = true;
          break;
        }
      } else {
        if (stored === attempt) {
          ok = true;
          matchedPlain = attempt;
          break;
        }
        // كمان جرّب الـ trim لو المخزّن قديم وفيه مسافة
        if (stored === attempt.trim()) {
          ok = true;
          matchedPlain = attempt.trim();
          break;
        }
      }
    }

    if (!ok) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid credentials" });
    }

    // ترقية كلمات السر النصية القديمة إلى bcrypt
    if (!isBcrypt && ok && process.env.MIGRATE_PLAIN_TO_BCRYPT === "1") {
      try {
        const hashed = await bcrypt.hash(
          matchedPlain ?? pass,
          Number(process.env.BCRYPT_ROUNDS || 10)
        );
        await pool.query(`UPDATE users SET password=? WHERE user_id=?`, [
          hashed,
          row.user_id,
        ]);
      } catch {}
    }

    const user = {
      user_id: row.user_id,
      username: row.username,
      email: row.email,
      role: row.role,
      bodyshape_id: row.bodyshape_id,
    };

    const token = jwt.sign(
      { sub: user.user_id, role: user.role, username: user.username },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: process.env.JWT_EXPIRES || "7d" }
    );

    res.json({ ok: true, user, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: "login_failed" });
  }
});

r.get("/me", async (_req, res) => res.json(null));
r.post("/logout", (_req, res) => res.json({ ok: true }));

/* =============== Registration (no bodyshape) =============== */
r.post("/", async (req, res) => {
  try {
    const { username, password, email, phone, birth_date, role, address } =
      req.body || {};

    if (!username || !password || !email) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    const [[dup]] = await pool.query(
      `SELECT user_id FROM users WHERE username=? OR email=? LIMIT 1`,
      [String(username).trim(), String(email).trim()]
    );
    if (dup) {
      return res.status(409).json({ error: "user_already_exists" });
    }

    const hashed = await bcrypt.hash(String(password), Number(BCRYPT_ROUNDS));
    const [rs] = await pool.query(
      `INSERT INTO users(username,password,email,phone,birth_date,role,address,bodyshape_id)
       VALUES (?,?,?,?,?,?,?,NULL)`,
      [
        String(username).trim(),
        hashed,
        String(email).trim(),
        phone || null,
        birth_date || null,
        role || "customer",
        address || null,
      ]
    );

    const user = {
      user_id: rs.insertId,
      username: String(username).trim(),
      email: String(email).trim(),
      role: role || "customer",
      bodyshape_id: null,
      phone: phone || null,
      address: address || null,
      birth_date: birth_date || null,
    };

    emitEvent("user.created", {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
    });

    try {
      await sendWelcomeEmail({ to: user.email, username: user.username });
    } catch {}

    const token = jwt.sign(
      { sub: user.user_id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({ ok: true, user, token });
  } catch (e) {
    console.error(e);
    if (e?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "user_already_exists" });
    }
    res.status(500).json({ error: "create_user_failed" });
  }
});

/* =============== Admin list (FIX 404) =============== */
// GET /api/users — list (admin only)
r.get("/", async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ ok: false, message: "Admins only" });
    }
    const [rows] = await pool.query(
      `SELECT user_id, username, email, phone, address, birth_date, role, bodyshape_id
         FROM users
         ORDER BY user_id DESC
         LIMIT 2000`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "list_users_failed" });
  }
});

/* =============== Public/Scoped profile =============== */

// GET /api/users/:id — single user (no password)
r.get("/:id", async (req, res) => {
  try {
    const [[u]] = await pool.query(
      `SELECT user_id, username, email, phone, address, birth_date, role, bodyshape_id
         FROM users WHERE user_id=?`,
      [req.params.id]
    );
    if (!u) return res.status(404).json({ message: "User not found" });
    res.json(strip(u));
  } catch {
    res.status(500).json({ error: "get_user_failed" });
  }
});

// PUT /api/users/:id/profile — self-service update
r.put("/:id/profile", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { username, email, phone, address, birth_date, bodyshape_id } =
      req.body || {};

    if (email) {
      const [[dup]] = await pool.query(
        "SELECT user_id FROM users WHERE email=? AND user_id<>?",
        [String(email).trim(), id]
      );
      if (dup)
        return res.status(409).json({ ok: false, message: "Email in use" });
    }

    const cols = [],
      vals = [];
    const push = (col, val) => {
      cols.push(`${col}=?`);
      vals.push(val ?? null);
    };

    if (username !== undefined) push("username", String(username).trim());
    if (email !== undefined) push("email", String(email).trim());
    if (phone !== undefined) push("phone", String(phone).trim());
    if (address !== undefined) push("address", String(address).trim());
    if (birth_date !== undefined) push("birth_date", birth_date || null);
    if (bodyshape_id !== undefined) push("bodyshape_id", bodyshape_id || null);

    if (!cols.length) return res.json({ ok: true, changed: 0 });

    vals.push(id);
    const [r1] = await pool.query(
      `UPDATE users SET ${cols.join(", ")} WHERE user_id=?`,
      vals
    );
    res.json({ ok: true, changed: r1.affectedRows });
  } catch {
    res.status(500).json({ error: "update_profile_failed" });
  }
});

// PUT /api/users/:id/password — change password
r.put("/:id/password", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { old_password, new_password } = req.body || {};
    if (!old_password || !new_password || String(new_password).length < 6) {
      return res.status(400).json({ ok: false, message: "Bad password" });
    }

    const [[u]] = await pool.query(
      "SELECT password FROM users WHERE user_id=?",
      [id]
    );
    if (!u)
      return res.status(404).json({ ok: false, message: "User not found" });

    const ok = await bcrypt.compare(String(old_password), String(u.password));
    if (!ok)
      return res.status(401).json({ ok: false, message: "Wrong password" });

    const hash = await bcrypt.hash(String(new_password), Number(BCRYPT_ROUNDS));
    await pool.query("UPDATE users SET password=? WHERE user_id=?", [hash, id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "change_password_failed" });
  }
});

// POST /api/users/:id/card-email — email pretty member card
r.post("/:id/card-email", async (req, res) => {
  try {
    if (!isMailEnabled)
      return res.status(503).json({ ok: false, message: "mail_disabled" });

    const id = Number(req.params.id);
    const [[user]] = await pool.query(
      `SELECT user_id, username, email, role, bodyshape_id FROM users WHERE user_id=?`,
      [id]
    );
    if (!user)
      return res.status(404).json({ ok: false, message: "User not found" });

    const svg = buildMemberCardSVG(user);
    const html = buildMemberCardHTML(user);

    const info = await sendMail({
      to: user.email,
      subject: `Your ${APP_NAME} Member Card`,
      html,
      text: `Member card for ${user.username} (user #${user.user_id}).`,
      attachments: [
        {
          filename: "HY-Moda-MemberCard.svg",
          content: svg,
          contentType: "image/svg+xml",
          cid: "membercard@hy",
        },
      ],
      bcc: ADMIN_EMAIL || undefined,
    });

    res.json({ ok: true, messageId: info?.messageId || null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "send_member_card_failed" });
  }
});

/* =============== Admin update/delete =============== */
r.put("/:id", async (req, res) => {
  try {
    const { username, email, phone, birth_date, role, address, bodyshape_id } =
      req.body || {};
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
  } catch {
    res.status(500).json({ error: "update_user_failed" });
  }
});

r.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE user_id=?", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    if (e?.errno === 1451) {
      return res.status(409).json({
        error: "user_has_dependencies",
        detail: "Remove or cascade children first.",
      });
    }
    res.status(500).json({ error: "delete_user_failed", detail: e?.message });
  }
});

export default r;

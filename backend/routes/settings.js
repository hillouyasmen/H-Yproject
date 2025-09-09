// backend/routes/settings.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Admins only" });
}

async function ensureSettingsRow() {
  try {
    await pool.query(
      `INSERT IGNORE INTO settings
         (id, site_name, tax_percent, shipping_flat, free_shipping_threshold)
       VALUES (1, 'H&Y Moda', 0, 0, 0)`
    );
  } catch {}
}

// GET /api/settings
router.get("/", requireAdmin, async (_req, res) => {
  try {
    await ensureSettingsRow();
    const [rows] = await pool.query(
      `SELECT site_name, tax_percent, shipping_flat, free_shipping_threshold
         FROM settings WHERE id=1`
    );
    const s = rows[0] || {};
    res.json({
      site_name: s.site_name || "H&Y Moda",
      tax_percent: Number(s.tax_percent || 0),
      shipping_flat: Number(s.shipping_flat || 0),
      free_shipping_threshold: Number(s.free_shipping_threshold || 0),
    });
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to load settings" });
  }
});

// PUT /api/settings
router.put("/", requireAdmin, async (req, res) => {
  const {
    site_name = "H&Y Moda",
    tax_percent = 0,
    shipping_flat = 0,
    free_shipping_threshold = 0,
  } = req.body || {};

  try {
    await ensureSettingsRow();
    await pool.query(
      `UPDATE settings
          SET site_name=?,
              tax_percent=?,
              shipping_flat=?,
              free_shipping_threshold=?
        WHERE id=1`,
      [
        String(site_name || "H&Y Moda"),
        Number(tax_percent) || 0,
        Number(shipping_flat) || 0,
        Number(free_shipping_threshold) || 0,
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to save settings" });
  }
});

// GET /api/settings/public
router.get("/public", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT site_name, tax_percent, shipping_flat, free_shipping_threshold
         FROM settings WHERE id=1`
    );
    const s = rows[0] || {};
    res.json({
      site_name: s.site_name || "H&Y Moda",
      tax_percent: Number(s.tax_percent || 0),
      shipping_flat: Number(s.shipping_flat || 0),
      free_shipping_threshold: Number(s.free_shipping_threshold || 0),
    });
  } catch {
    res.json({
      site_name: "H&Y Moda",
      tax_percent: 0,
      shipping_flat: 0,
      free_shipping_threshold: 0,
    });
  }
});

export default router;

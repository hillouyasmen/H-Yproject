import { Router } from "express";
import { pool } from "../db.js";

const r = Router();

r.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM suppliers ORDER BY supplier_id"
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "list_suppliers_failed" });
  }
});

r.post("/", async (req, res) => {
  try {
    const { supplier_name, contact_date } = req.body;
    const [rs] = await pool.query(
      "INSERT INTO suppliers(supplier_name, contact_date) VALUES(?,?)",
      [supplier_name, contact_date || null]
    );
    res.json({ supplier_id: rs.insertId, supplier_name, contact_date });
  } catch (e) {
    res.status(500).json({ error: "create_supplier_failed" });
  }
});

r.put("/:id", async (req, res) => {
  try {
    const { supplier_name, contact_date } = req.body;
    await pool.query(
      "UPDATE suppliers SET supplier_name=?, contact_date=? WHERE supplier_id=?",
      [supplier_name, contact_date || null, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "update_supplier_failed" });
  }
});

r.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM suppliers WHERE supplier_id=?", [
      req.params.id,
    ]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "delete_supplier_failed" });
  }
});

export default r;

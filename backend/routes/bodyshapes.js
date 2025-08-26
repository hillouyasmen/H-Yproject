import { Router } from "express";
import { pool } from "../db.js";

const r = Router();

// GET all bodyshapes
r.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM bodyshapes ORDER BY bodyshape_id"
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "list_bodyshapes_failed" });
  }
});

// CREATE bodyshape
r.post("/", async (req, res) => {
  try {
    const { shape_name, description } = req.body;
    const [rs] = await pool.query(
      "INSERT INTO bodyshapes(shape_name,description) VALUES(?,?)",
      [shape_name, description || null]
    );
    res.json({ bodyshape_id: rs.insertId, shape_name, description });
  } catch (e) {
    res.status(500).json({ error: "create_bodyshape_failed" });
  }
});

// UPDATE bodyshape
r.put("/:id", async (req, res) => {
  try {
    const { shape_name, description } = req.body;
    await pool.query(
      "UPDATE bodyshapes SET shape_name=?, description=? WHERE bodyshape_id=?",
      [shape_name, description || null, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "update_bodyshape_failed" });
  }
});

// DELETE bodyshape
r.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM bodyshapes WHERE bodyshape_id=?", [
      req.params.id,
    ]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "delete_bodyshape_failed" });
  }
});

export default r;

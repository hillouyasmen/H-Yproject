import { Router } from "express";
import { pool } from "../db.js";

const r = Router();

/* helper: اقرأ الـ variations مع fallback لو الـ VIEW مش موجود */
async function listByProduct(product_id) {
  try {
    const [rows] = await pool.query(
      "SELECT product_id,color,size,price,quantity FROM variations WHERE product_id=? ORDER BY color,size",
      [product_id]
    );
    return rows;
  } catch (err) {
    // لو الـ VIEW variations مش موجود -> fallback للجدول الأساسي
    if (err?.code === "ER_NO_SUCH_TABLE" || err?.errno === 1146) {
      const [rows] = await pool.query(
        "SELECT product_id,color,size,price,quantity FROM product_variations WHERE product_id=? ORDER BY color,size",
        [product_id]
      );
      return rows;
    }
    throw err;
  }
}

/** GET /api/variations?product_id=123  (المسار الحالي) */
r.get("/", async (req, res) => {
  try {
    const pid = Number(req.query.product_id);
    if (!pid) return res.status(400).json({ message: "product_id required" });
    const rows = await listByProduct(pid);
    res.json(rows);
  } catch (e) {
    console.error("list_variations /:", e);
    res.status(500).json({ error: "list_variations_failed" });
  }
});

/** GET /api/variations/product/:product_id  (المسار القديم يبقى شغال) */
r.get("/product/:product_id", async (req, res) => {
  try {
    const pid = Number(req.params.product_id);
    const rows = await listByProduct(pid);
    res.json(rows);
  } catch (e) {
    console.error("list_variations /product/:id", e);
    res.status(500).json({ error: "list_variations_failed" });
  }
});

/** POST — إنشاء Variation (نكتب على الجدول الأساسي) */
r.post("/", async (req, res) => {
  try {
    const { product_id, color, size, price, quantity } = req.body;
    await pool.query(
      "INSERT INTO product_variations(product_id,color,size,price,quantity) VALUES(?,?,?,?,?)",
      [product_id, color, size, price, quantity ?? 0]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("create_variation:", e);
    res.status(500).json({ error: "create_variation_failed" });
  }
});

/** PUT — تحديث السعر/الكمية */
r.put("/", async (req, res) => {
  try {
    const { product_id, color, size, price, quantity } = req.body;
    await pool.query(
      "UPDATE product_variations SET price=?, quantity=? WHERE product_id=? AND color=? AND size=?",
      [price, quantity, product_id, color, size]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("update_variation:", e);
    res.status(500).json({ error: "update_variation_failed" });
  }
});

/** PATCH /stock — تعديل المخزون (+/-) */
r.patch("/stock", async (req, res) => {
  try {
    const { product_id, color, size, delta } = req.body;
    await pool.query(
      "UPDATE product_variations SET quantity = quantity + ? WHERE product_id=? AND color=? AND size=?",
      [delta, product_id, color, size]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("stock_update:", e);
    res.status(500).json({ error: "stock_update_failed" });
  }
});

/** DELETE — حذف Variation */
r.delete("/", async (req, res) => {
  try {
    const { product_id, color, size } = req.body;
    await pool.query(
      "DELETE FROM product_variations WHERE product_id=? AND color=? AND size=?",
      [product_id, color, size]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("delete_variation:", e);
    res.status(500).json({ error: "delete_variation_failed" });
  }
});

export default r;

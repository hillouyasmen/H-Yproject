import { Router } from "express";
import { pool } from "../db.js";

const r = Router();

/** GET /api/products — قائمة المنتجات */
r.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.category_name, s.supplier_name, b.shape_name
         FROM products p
    LEFT JOIN categories c ON p.category_id=c.category_id
    LEFT JOIN suppliers  s ON p.supplier_id=s.supplier_id
    LEFT JOIN bodyshapes b ON p.bodyshape_id=b.bodyshape_id
     ORDER BY p.product_id`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "list_products_failed" });
  }
});

/** GET /api/products/:id — منتج واحد فقط (بدون variations) */
r.get("/:id", async (req, res) => {
  try {
    const [[product]] = await pool.query(
      "SELECT * FROM products WHERE product_id=?",
      [req.params.id]
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: "get_product_failed" });
  }
});

/** POST /api/products — إنشاء منتج */
r.post("/", async (req, res) => {
  try {
    const {
      category_id,
      supplier_id,
      bodyshape_id,
      product_name,
      description,
      rating,
      image_url,
    } = req.body;
    const [rs] = await pool.query(
      `INSERT INTO products(category_id,supplier_id,bodyshape_id,product_name,description,rating,image_url)
       VALUES (?,?,?,?,?,?,?)`,
      [
        category_id || null,
        supplier_id || null,
        bodyshape_id || null,
        product_name,
        description || null,
        rating || null,
        image_url || null,
      ]
    );
    res.json({ product_id: rs.insertId, product_name });
  } catch (e) {
    res.status(500).json({ error: "create_product_failed" });
  }
});

/** PUT /api/products/:id — تحديث منتج */
r.put("/:id", async (req, res) => {
  try {
    const {
      category_id,
      supplier_id,
      bodyshape_id,
      product_name,
      description,
      rating,
      image_url,
    } = req.body;
    await pool.query(
      `UPDATE products
          SET category_id=?, supplier_id=?, bodyshape_id=?, product_name=?, description=?, rating=?, image_url=?
        WHERE product_id=?`,
      [
        category_id || null,
        supplier_id || null,
        bodyshape_id || null,
        product_name,
        description || null,
        rating || null,
        image_url || null,
        req.params.id,
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "update_product_failed" });
  }
});

/** DELETE /api/products/:id — حذف منتج */
r.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE product_id=?", [
      req.params.id,
    ]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "delete_product_failed" });
  }
});

export default r;

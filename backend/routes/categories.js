// backend/routes/categories.js
import { Router } from "express";
import { pool as db } from "../db.js";
const router = Router();

/**
 * GET /api/categories
 * Optional: ?bodyshape_id=#
 * - If bodyshape_id provided => only categories mapped to that bodyshape (via category_bodyshape)
 * - Else => all categories
 */
router.get("/", async (req, res, next) => {
  try {
    const { bodyshape_id } = req.query;

    if (bodyshape_id) {
      const [rows] = await db.query(
        `SELECT c.*
           FROM categories c
           JOIN category_bodyshape cb ON cb.category_id = c.category_id
          WHERE cb.bodyshape_id = ?
          ORDER BY c.category_name`,
        [bodyshape_id]
      );
      return res.json(rows);
    }

    const [rows] = await db.query(
      `SELECT * FROM categories ORDER BY category_name`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/categories/:id/products
 * Optional: ?bodyshape_id=#
 * - Always returns products that belong to this category
 */
router.get("/:id/products", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bodyshape_id } = req.query;

    if (bodyshape_id) {
      const [rows] = await db.query(
        `SELECT p.*
           FROM products p
          WHERE p.category_id = ?
            AND (p.bodyshape_id = ? OR p.bodyshape_id IS NULL)
          ORDER BY p.product_name`,
        [id, bodyshape_id]
      );
      return res.json(rows);
    }

    const [rows] = await db.query(
      `SELECT p.* FROM products p
        WHERE p.category_id = ?
        ORDER BY p.product_name`,
      [id]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/**
 * (Admin) Create category
 * POST /api/categories  { category_name, image_url? }
 */
router.post("/", async (req, res, next) => {
  try {
    const { category_name, image_url = null } = req.body;
    if (!category_name) {
      return res.status(400).json({ message: "category_name is required" });
    }
    const [r] = await db.query(
      `INSERT INTO categories (category_name, image_url) VALUES (?, ?)`,
      [category_name, image_url]
    );
    res.status(201).json({ category_id: r.insertId, category_name, image_url });
  } catch (e) {
    next(e);
  }
});

/**
 * (Admin) Update category
 * PUT /api/categories/:id  { category_name?, image_url? }
 */
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    let { category_name = null, image_url = null } = req.body;

    // read current
    const [curRows] = await db.query(
      `SELECT category_name, image_url FROM categories WHERE category_id = ?`,
      [id]
    );
    if (curRows.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }
    const cur = curRows[0];

    // keep old if field not provided
    if (category_name == null) category_name = cur.category_name;
    if (image_url === undefined) image_url = cur.image_url;

    await db.query(
      `UPDATE categories SET category_name = ?, image_url = ? WHERE category_id = ?`,
      [category_name, image_url, id]
    );

    res.json({ ok: true, category_id: Number(id), category_name, image_url });
  } catch (e) {
    next(e);
  }
});

/**
 * (Admin) Delete category
 * DELETE /api/categories/:id
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM categories WHERE category_id = ?`, [id]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/**
 * (Admin) Map a category to bodyshapes
 * POST /api/categories/:id/bodyshapes  { bodyshape_ids: [1,3,5] }
 * Replaces previous mapping completely.
 */
router.post("/:id/bodyshapes", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bodyshape_ids = [] } = req.body;

    await db.query(`DELETE FROM category_bodyshape WHERE category_id = ?`, [
      id,
    ]);

    if (Array.isArray(bodyshape_ids) && bodyshape_ids.length) {
      const values = bodyshape_ids.map((bid) => [id, bid]);
      await db.query(
        `INSERT INTO category_bodyshape (category_id, bodyshape_id) VALUES ?`,
        [values]
      );
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/**
 * (Admin) Read mappings for a category
 * GET /api/categories/:id/bodyshapes
 */
router.get("/:id/bodyshapes", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT b.bodyshape_id, b.shape_name
         FROM category_bodyshape cb
         JOIN bodyshapes b ON b.bodyshape_id = cb.bodyshape_id
        WHERE cb.category_id = ?
        ORDER BY b.shape_name`,
      [id]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

export default router;

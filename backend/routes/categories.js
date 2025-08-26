<<<<<<< HEAD
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
 * GET /api/categories/:id/products?bodyshape_id=#
 * - REQUIRED: bodyshape_id
 * - Returns ONLY products that:
 *    1) belong to this category, AND
 *    2) have products.bodyshape_id = bodyshape_id, AND
 *    3) the category is mapped to that bodyshape (category_bodyshape)
 */
router.get("/:id/products", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bodyshape_id } = req.query;

    if (!bodyshape_id) {
      return res.status(400).json({ message: "bodyshape_id is required" });
    }

    const [rows] = await db.query(
      `SELECT p.*
         FROM products p
         INNER JOIN category_bodyshape cb
                 ON cb.category_id = p.category_id
                AND cb.bodyshape_id = ?
        WHERE p.category_id = ?
          AND p.bodyshape_id = ?
        ORDER BY p.product_name`,
      [bodyshape_id, id, bodyshape_id]
    );

    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/**
 * (Admin) Create category
 * POST /api/categories  { category_name }
 */
router.post("/", async (req, res, next) => {
  try {
    const { category_name } = req.body;
    if (!category_name) {
      return res.status(400).json({ message: "category_name is required" });
    }
    const [r] = await db.query(
      `INSERT INTO categories (category_name) VALUES (?)`,
      [category_name]
    );
    res.status(201).json({ category_id: r.insertId, category_name });
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
=======
const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories');
    
    // Return categories in the expected format
    res.json({ 
      success: true, 
      data: Array.isArray(categories) ? categories : [] 
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return empty array in the expected format on error
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch categories',
      data: [] 
    });
  }
});

// Get single category by ID
router.get('/:id', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    
    if (categories.length === 0) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    
    res.json({ success: true, data: categories[0] });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch category' });
  }
});

module.exports = router;
>>>>>>> 96d5d4fa470c5e3711e74096bc067efa4f6df75d

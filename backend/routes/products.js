<<<<<<< HEAD
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
=======
const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all products with optional filtering by category or body shape
router.get('/', async (req, res) => {
  const { category, shape } = req.query;
  
  try {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (shape) {
      query += ' AND body_shape = ?';
      params.push(shape);
    }
    
    console.log('Executing query:', query, 'with params:', params);
    const [rows] = await db.query(query, params);
    
    // Process the results to ensure consistent format
    const processedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      category: row.category,
      stock_quantity: row.stock_quantity,
      image_url: row.image_url || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      body_shape: row.body_shape || null
    }));
    
    res.json({ success: true, data: processedRows });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching products',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    
    if (!rows.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }
    
    const product = rows[0];
    
    res.json({ 
      success: true, 
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        category: product.category,
        stock_quantity: product.stock_quantity,
        image_url: product.image_url || null,
        created_at: product.created_at,
        updated_at: product.updated_at,
        body_shape: product.body_shape || null
      }
    });
    
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching product',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Add a new product
router.post('/', async (req, res) => {
  const { 
    name, description, price, 
    category, stock_quantity, image_url, 
    body_shape 
  } = req.body;
  
  // Required fields validation
  if (!name || !price || !category) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: name, price, and category are required' 
    });
  }
  
  try {
    // Insert the product
    const [result] = await db.query(
      `INSERT INTO products (
        name, description, price, category,
        stock_quantity, image_url, body_shape
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        parseFloat(price),
        category,
        parseInt(stock_quantity) || 0,
        image_url || null,
        body_shape || null
      ]
    );
    
    const productId = result.insertId;
    
    // Get the newly created product
    const [newProduct] = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );
    
    res.status(201).json({ 
      success: true, 
      data: newProduct[0] || { id: productId }
    });
    
  } catch (err) {
    console.error('Error adding product:', err);
    
    res.status(500).json({ 
      success: false, 
      error: 'Error adding product',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update a product
router.put('/:id', async (req, res) => {
  const productId = req.params.id;
  const { 
    name, description, price, 
    category, stock_quantity, image_url, 
    body_shape 
  } = req.body;
  
  // Required fields validation
  if (!name || !price || !category) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: name, price, and category are required' 
    });
  }
  
  try {
    // Update product fields
    const [result] = await db.query(
      `UPDATE products SET 
        name = ?, 
        description = ?, 
        price = ?, 
        category = ?,
        stock_quantity = ?, 
        image_url = ?,
        body_shape = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        name,
        description || null,
        parseFloat(price),
        category,
        parseInt(stock_quantity) || 0,
        image_url || null,
        body_shape || null,
        productId
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }
    
    // Get the updated product
    const [updatedProduct] = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );
    
    res.json({ 
      success: true, 
      message: 'Product updated',
      data: updatedProduct[0] || { id: productId }
    });
    
  } catch (err) {
    console.error('Error updating product:', err);
    
    res.status(500).json({ 
      success: false, 
      error: 'Error updating product',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  const productId = req.params.id;
  
  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [productId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    });
    
  } catch (err) {
    console.error('Error deleting product:', err);
    
    res.status(500).json({ 
      success: false, 
      error: 'Error deleting product',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router; 
>>>>>>> 96d5d4fa470c5e3711e74096bc067efa4f6df75d

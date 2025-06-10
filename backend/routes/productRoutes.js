// Product routes
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all products
router.get('/', async (req, res) => {
  try {
    const [products] = await db.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name'
    );
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get products by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const [products] = await db.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.category_id = ? ORDER BY p.name',
      [categoryId]
    );
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new product
router.post('/', async (req, res) => {
  try {
    const { name, price, description, category_id, image_url } = req.body;

    // Validate input
    if (!name || !price || !description || !category_id) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Insert new product
    const [result] = await db.query(
      'INSERT INTO products (name, price, description, category_id, image_url) VALUES (?, ?, ?, ?, ?)',
      [name, price, description, category_id, image_url]
    );

    res.status(201).json({ 
      message: 'Product added successfully',
      productId: result.insertId 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { name, price, description, category_id, image_url } = req.body;
    const productId = req.params.id;

    // Validate input
    if (!name || !price || !description || !category_id) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Update product
    await db.query(
      'UPDATE products SET name = ?, price = ?, description = ?, category_id = ?, image_url = ? WHERE id = ?',
      [name, price, description, category_id, image_url, productId]
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    // Delete product
    await db.query('DELETE FROM products WHERE id = ?', [productId]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

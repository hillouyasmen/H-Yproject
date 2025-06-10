// Category routes
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all categories with product count
router.get('/', async (req, res) => {
  try {
    const [categories] = await db.query(
      `SELECT c.*, COUNT(p.id) as product_count 
       FROM categories c 
       LEFT JOIN products p ON c.id = p.category_id 
       GROUP BY c.id 
       ORDER BY c.name`
    );
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get category by ID with its products
router.get('/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    const [categories] = await db.query(
      'SELECT * FROM categories WHERE id = ?',
      [categoryId]
    );

    if (categories.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const [products] = await db.query(
      'SELECT * FROM products WHERE category_id = ?',
      [categoryId]
    );

    res.json({
      ...categories[0],
      products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new category
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category name already exists
    const [existing] = await db.query(
      'SELECT id FROM categories WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    // Insert new category
    const [result] = await db.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description]
    );

    res.status(201).json({ 
      message: 'Category added successfully',
      categoryId: result.insertId 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const categoryId = req.params.id;

    // Validate input
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category exists
    const [existing] = await db.query(
      'SELECT id FROM categories WHERE id = ?',
      [categoryId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Update category
    await db.query(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description, categoryId]
    );

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Check if category has products
    const [products] = await db.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [categoryId]
    );

    if (products[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with associated products' 
      });
    }

    // Delete category
    await db.query('DELETE FROM categories WHERE id = ?', [categoryId]);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

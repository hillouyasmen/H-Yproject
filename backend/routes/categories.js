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

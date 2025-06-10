const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const [categories] = await pool.query(
            'SELECT category_id, name, description, image_url FROM categories'
        );
        
        // Add default image URL if not provided
        const categoriesWithImages = categories.map(category => ({
            ...category,
            image_url: category.image_url || 'https://via.placeholder.com/300'
        }));
        
        res.json(categoriesWithImages);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

// Get products by category
router.get('/:categoryId/products', async (req, res) => {
    try {
        const [products] = await pool.query(
            'SELECT * FROM products WHERE category_id = ?',
            [req.params.categoryId]
        );
        res.json(products);
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Get all products
router.get('/', async (req, res) => {
    try {
        const [products] = await pool.query('SELECT * FROM products');
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// Get products by category
router.get('/category/:categoryId', async (req, res) => {
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

// Get product by ID
router.get('/:productId', async (req, res) => {
    try {
        const [products] = await pool.query(
            'SELECT * FROM products WHERE id = ?',
            [req.params.productId]
        );
        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(products[0]);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Error fetching product' });
    }
});

module.exports = router;

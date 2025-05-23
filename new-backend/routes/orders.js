const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [orders] = await pool.query(
      `SELECT o.*, p.name as product_name, p.price, p.image_url 
       FROM orders o 
       JOIN products p ON o.product_id = p.id 
       WHERE o.user_id = ? 
       ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const { product_id, quantity, shipping_address } = req.body;
    const userId = req.user.id;

    const [result] = await pool.query(
      'INSERT INTO orders (user_id, product_id, quantity, shipping_address) VALUES (?, ?, ?, ?)',
      [userId, product_id, quantity, shipping_address]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      product_id,
      quantity,
      shipping_address,
      created_at: new Date()
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
});

module.exports = router;

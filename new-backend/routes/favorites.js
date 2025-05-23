const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Get user's favorites
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [favorites] = await pool.query(
      `SELECT f.*, p.name, p.price, p.image_url, p.description 
       FROM favorites f 
       JOIN products p ON f.product_id = p.id 
       WHERE f.user_id = ?`,
      [userId]
    );

    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Error fetching favorites' });
  }
});

// Add to favorites
router.post('/', auth, async (req, res) => {
  try {
    const { product_id } = req.body;
    const userId = req.user.id;

    // Check if already in favorites
    const [existing] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Already in favorites' });
    }

    // Add to favorites
    const [result] = await pool.query(
      'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
      [userId, product_id]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      product_id
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ message: 'Error adding to favorites' });
  }
});

// Remove from favorites
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [result] = await pool.query(
      'DELETE FROM favorites WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ message: 'Error removing from favorites' });
  }
});

module.exports = router;

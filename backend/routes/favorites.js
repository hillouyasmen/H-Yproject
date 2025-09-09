const express = require('express');
const db = require('../db');

const r = express.Router();

// Get user's favorites
r.get('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const query = `
      SELECT f.*, p.name, p.price, p.image_url, p.category_id
      FROM favorites f
      JOIN products p ON f.product_id = p.product_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `;
    
    const favorites = await db.all(query, [user_id]);
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Add product to favorites
r.post('/', async (req, res) => {
  try {
    const { user_id, product_id } = req.body;
    
    if (!user_id || !product_id) {
      return res.status(400).json({ error: 'user_id and product_id are required' });
    }
    
    // Check if already in favorites
    const existing = await db.get(
      'SELECT * FROM favorites WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );
    
    if (existing) {
      return res.status(400).json({ error: 'Product already in favorites' });
    }
    
    // Add to favorites
    const result = await db.run(
      'INSERT INTO favorites (user_id, product_id, created_at) VALUES (?, ?, datetime("now"))',
      [user_id, product_id]
    );
    
    res.json({ 
      message: 'Product added to favorites',
      favorite_id: result.lastID
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
});

// Remove product from favorites
r.delete('/', async (req, res) => {
  try {
    const { user_id, product_id } = req.body;
    
    if (!user_id || !product_id) {
      return res.status(400).json({ error: 'user_id and product_id are required' });
    }
    
    const result = await db.run(
      'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }
    
    res.json({ message: 'Product removed from favorites' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

// Check if product is in user's favorites
r.get('/check/:user_id/:product_id', async (req, res) => {
  try {
    const { user_id, product_id } = req.params;
    
    const favorite = await db.get(
      'SELECT * FROM favorites WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );
    
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ error: 'Failed to check favorite status' });
  }
});

module.exports = r;


/**
 * H&Y Moda - Fashion Management System
 * Items API Routes
 * Developed by: Hazem Habrat & Yasmeen Hiloou
 * Date: June 2025
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all items
router.get('/', (req, res) => {
  db.query('SELECT * FROM items', (err, results) => {
    if (err) {
      console.error('Error fetching items:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch items' });
    }
    res.json({ success: true, data: results });
  });
});

// Create new item
router.post('/', (req, res) => {
  const { name, description, price, category, image_url, created_by } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Name and price are required' });
  }
  
  db.query(
    'INSERT INTO items (name, description, price, category, image_url, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, price, category, image_url, created_by],
    (err, result) => {
      if (err) {
        console.error('Error creating item:', err);
        return res.status(500).json({ success: false, message: 'Failed to create item' });
      }
      
      // Return the created item
      db.query('SELECT * FROM items WHERE id = ?', [result.insertId], (err, results) => {
        if (err || results.length === 0) {
          return res.status(201).json({
            success: true,
            message: 'Item created successfully',
            data: { id: result.insertId, name, description, price, category, image_url, created_by }
          });
        }
        res.status(201).json({ success: true, data: results[0] });
      });
    }
  );
});

// Update item
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, image_url } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Name and price are required' });
  }
  
  db.query(
    'UPDATE items SET name = ?, description = ?, price = ?, category = ?, image_url = ? WHERE id = ?',
    [name, description, price, category, image_url, id],
    (err, result) => {
      if (err) {
        console.error('Error updating item:', err);
        return res.status(500).json({ success: false, message: 'Failed to update item' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      
      // Return the updated item
      db.query('SELECT * FROM items WHERE id = ?', [id], (err, results) => {
        if (err || results.length === 0) {
          return res.json({
            success: true,
            message: 'Item updated successfully',
            data: { id, name, description, price, category, image_url }
          });
        }
        res.json({ success: true, data: results[0] });
      });
    }
  );
});

// Delete item
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.query('DELETE FROM items WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting item:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete item' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    res.json({ success: true, message: 'Item deleted successfully' });
  });
});

module.exports = router;
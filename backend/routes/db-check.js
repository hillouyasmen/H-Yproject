const express = require('express');
const router = express.Router();
const db = require('../db');

// Debug route to check orders table structure
router.get('/check-orders-schema', async (req, res) => {
  try {
    // Get table structure
    const [columns] = await db.query('DESCRIBE orders');
    
    // Get sample data
    const [orders] = await db.query('SELECT * FROM orders LIMIT 1');
    
    // Get order items structure
    let orderItemsColumns = [];
    let sampleItems = [];
    
    if (orders.length > 0) {
      [orderItemsColumns] = await db.query('DESCRIBE order_items');
      [sampleItems] = await db.query('SELECT * FROM order_items WHERE order_id = ? LIMIT 1', [orders[0].id]);
    }
    
    res.json({
      success: true,
      ordersTable: {
        columns,
        sample: orders[0] || 'No orders found'
      },
      orderItemsTable: {
        columns: orderItemsColumns,
        sample: sampleItems[0] || 'No items found'
      }
    });
  } catch (error) {
    console.error('Error checking database schema:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Debug route to get orders for a specific user
router.get('/user-orders/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Get user's orders
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db');

// Process checkout and create order
router.post('/', async (req, res) => {
  const { 
    userId, 
    items, 
    shippingAddress, 
    paymentMethod, 
    totalAmount,
    email,
    phone
  } = req.body;

  // Basic validation
  if (!userId || !items || !Array.isArray(items) || items.length === 0 || !shippingAddress || !paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Create payment record
    const [paymentResult] = await connection.query(
      `INSERT INTO payments 
       (user_id, amount, payment_method, status, created_at)
       VALUES (?, ?, ?, 'completed', NOW())`,
      [userId, totalAmount, paymentMethod]
    );
    const paymentId = paymentResult.insertId;

    // Create the order
    const [orderResult] = await connection.query(
      `INSERT INTO orders 
       (user_id, total_price, status, payment_id, shipping_address, email, phone, created_at)
       VALUES (?, ?, 'processing', ?, ?, ?, ?, NOW())`,
      [userId, totalAmount, paymentId, JSON.stringify(shippingAddress), email, phone]
    );
    
    const orderId = orderResult.insertId;
    
    // Add order items
    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items 
         (order_id, product_id, quantity, price_per_unit)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.id, item.quantity, item.price]
      );
      
      // Update product stock
      if (item.id) {
        await connection.query(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.id]
        );
      }
    }
    
    // Get basic order details
    const [orderRows] = await connection.query(
      `SELECT * FROM orders WHERE id = ?`,
      [orderId]
    );
    
    const [itemRows] = await connection.query(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [orderId]
    );
    
    const orderData = {
      id: orderId,
      userId: orderRows[0].user_id,
      totalPrice: orderRows[0].total_price,
      status: orderRows[0].status,
      paymentId: orderRows[0].payment_id,
      items: itemRows
    };

    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: orderData
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Checkout failed',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Get order details
router.get('/:orderId', async (req, res) => {
  try {
    const [orderRows] = await db.query(
      `SELECT * FROM orders WHERE id = ?`,
      [req.params.orderId]
    );
    
    if (orderRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const [items] = await db.query(
      `SELECT oi.*, p.name, p.image_url 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [req.params.orderId]
    );
    
    const order = {
      ...orderRows[0],
      shippingAddress: JSON.parse(orderRows[0].shipping_address || '{}'),
      items: items
    };
    
    res.json({
      success: true,
      order: order
    });
    
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order',
      error: error.message
    });
  }
});

module.exports = router;

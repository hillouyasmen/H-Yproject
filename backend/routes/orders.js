const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendOrderConfirmation, sendPaymentConfirmation } = require('../services/notificationService');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// Create new order
router.post('/', async (req, res) => {
  console.log('Received order creation request:', JSON.stringify(req.body, null, 2));
  
  // الآن أضف حقول الكريدت كارد مع destructuring
  const { 
    user_id, total_amount, status, items, shipping_address, payment_method, 
    customer_name, customer_email, customer_phone,
    credit_card_number, credit_card_expiry, credit_card_cvv // الجديد
  } = req.body;

  // تحقق من وجود جميع البيانات المطلوبة
  if (!user_id || total_amount === undefined || !items || !Array.isArray(items) || items.length === 0) {
    console.error('Validation failed:', { user_id, total_amount, items: items?.length });
    return res.status(400).json({ 
      success: false, 
      message: 'User ID, total price, and at least one order item are required',
      received: { user_id, total_amount, items: items?.length }
    });
  }

  // 👉 التعامل مع بيانات الكريدت كارد
  // ⚠️ لا تحفظها في الداتابيس! استخدمها فقط إذا تريد إرسالها إلى خدمة دفع أو بريدك فقط
  if (credit_card_number && credit_card_expiry && credit_card_cvv) {
    // مثال: إرسال رسالة بريد إلكتروني للإدارة (استخدم nodemailer أو أي خدمة)
    // await sendOrderToAdminOrPayment({
    //   customer_name, customer_email, customer_phone, shipping_address,
    //   credit_card_number, credit_card_expiry, credit_card_cvv,
    //   total_amount, items
    // });
    // أو استخدمها لمعالجة الدفع عبر Stripe/PayPal ثم احذفها من الذاكرة
    console.log('Received Credit Card Info (will NOT be stored!):', {
      last4: credit_card_number.slice(-4),
      credit_card_expiry,
      credit_card_cvv: '***' // لا تطبع السي في في بالكامل أبداً
    });
  }

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // إنشاء الطلب: **بدون حقول الكريدت كارد**
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        user_id, 
        total_amount, 
        status, 
        shipping_address, 
        payment_method, 
        customer_name, 
        customer_email, 
        customer_phone,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        user_id, 
        total_amount, 
        status || 'pending',
        shipping_address || '',
        payment_method || 'credit_card',
        customer_name || '',
        customer_email || '',
        customer_phone || ''
      ]
    );
    
    const orderId = orderResult.insertId;
    console.log(`Created order with ID: ${orderId}`);
    
    // Add order items
    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items 
         (order_id, product_id, quantity, price_per_unit) 
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price_per_unit]
      );
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }
    
    await connection.commit();
    
    // Get the full order details with items
    const [order] = await db.query(
      `SELECT o.*, 
              oi.id as item_id, oi.quantity, oi.price_per_unit,
              p.name as product_name, p.description as product_description
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.id = ?`,
      [orderId]
    );
    
    // Format the order data
    const orderData = {
      id: order[0].id,
      user_id: order[0].user_id,
      total_price: order[0].total_price,
      status: order[0].status,
      created_at: order[0].created_at,
      items: order.map(item => ({
        id: item.item_id,
        product_id: item.product_id,
        name: item.product_name,
        description: item.product_description,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit
      }))
    };
    
    // Send order confirmation email (in background, don't wait for it)
    const userEmail = req.user?.email;
    if (userEmail) {
      sendOrderConfirmation(orderData, userEmail).catch(console.error);
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Order created successfully',
      orderId,
      data: orderData
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create order',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});



// Get all orders (admin only)
router.get('/', async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, u.username, u.email 
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    
    res.json({ 
      success: true, 
      data: orders 
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders',
      error: error.message 
    });
  }
});

// Get orders by user ID
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const { includeItems, status } = req.query;
  
  // Check if the user is requesting their own orders or is an admin
  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Not authorized to view these orders' 
    });
  }
  
  try {
    // Base query to get orders
    let query = `
      SELECT o.*, 
             u.username, u.email, u.full_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.user_id = ?
    `;
    
    const queryParams = [userId];
    
    // Add status filter if provided
    if (status) {
      query += ' AND o.status = ?';
      queryParams.push(status);
    }
    
    // Add sorting
    query += ' ORDER BY o.created_at DESC';
    
    console.log('Executing query:', query, 'with params:', queryParams);
    const [orders] = await db.query(query, queryParams);
    
    // If no orders found, return empty array
    if (!orders || orders.length === 0) {
      return res.json([]);
    }
    
    // If includeItems is true, fetch order items for each order
    if (includeItems === 'true') {
      const orderIds = orders.map(order => order.id);
      
      // First, get all order items with basic product info
      const [orderItems] = await db.query(
        `SELECT 
          oi.id,
          oi.order_id,
          oi.product_id,
          oi.quantity,
          oi.price_per_unit,
          p.name as product_name,
          p.image_url,
          p.id as product_id
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id IN (?)`,
        [orderIds]
      );
      
      // Group items by order_id
      const itemsByOrderId = orderItems.reduce((acc, item) => {
        if (!acc[item.order_id]) {
          acc[item.order_id] = [];
        }
        acc[item.order_id].push({
          id: item.id,
          product_id: item.product_id,
          quantity: parseInt(item.quantity, 10) || 1,
          price_per_unit: parseFloat(item.price_per_unit) || 0,
          name: item.product_name || 'Product not found',
          image: item.image_url || '/placeholder-product.jpg',
          price: parseFloat(item.price_per_unit) || 0,
          // Calculate total price for each item
          total_price: (parseFloat(item.price_per_unit) || 0) * (parseInt(item.quantity, 10) || 1)
        });
        return acc;
      }, {});
      
      // Add items to their respective orders and calculate order totals
      const ordersWithItems = orders.map(order => {
        const orderItems = itemsByOrderId[order.id] || [];
        const calculatedTotal = orderItems.reduce(
          (sum, item) => sum + (item.price_per_unit * item.quantity), 
          0
        );
        
        return {
          ...order,
          total_amount: parseFloat(order.total_amount || calculatedTotal),
          items: orderItems,
          // Add formatted date for display
          formatted_date: new Date(order.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };
      });
      
      return res.json(ordersWithItems);
    }
    
    // Return orders without items if includeItems is false
    res.json(orders.map(order => ({
      ...order,
      total_amount: parseFloat(order.total_amount),
      items: []
    })));
    
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user orders',
      error: error.message 
    });
  }
});

// Get order by ID with items
router.get('/:id', async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, u.username, u.email, u.full_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [req.params.id]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    const [items] = await db.query(
      `SELECT oi.*, p.name as product_name, p.image_url 
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );
    
    const order = {
      ...orders[0],
      items
    };
    
    res.json({ 
      success: true, 
      data: order 
    });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch order',
      error: error.message 
    });
  }
});

// Get orders by user
router.get('/user/:userId', async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, 
              (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [req.params.userId]
    );
    
    res.json({ 
      success: true, 
      data: orders 
    });
    
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user orders',
      error: error.message 
    });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  console.log('Received status update request:', {
    orderId: req.params.id,
    body: req.body
  });

  const { status, notifyUser = true } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  
  if (!status || !validStatuses.includes(status)) {
    console.error('Invalid status:', status);
    return res.status(400).json({
      success: false,
      message: 'Valid status is required (pending, processing, shipped, delivered, cancelled)'
    });
  }

  let connection;
  try {
    // Get database connection
    console.log('Getting database connection...');
    connection = await db.getConnection();
    console.log('Database connection established');
    
    await connection.beginTransaction();
    console.log('Transaction started');
    
    // Update the order status
    console.log(`Updating order ${req.params.id} status to ${status}`);
    const [result] = await connection.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    
    console.log('Update result:', result);
    
    if (result.affectedRows === 0) {
      throw new Error(`Order with ID ${req.params.id} not found`);
    }
    
    // If this is a payment confirmation, send payment confirmation email
    if (status === 'processing' && notifyUser) {
      console.log('Processing payment confirmation email');
      try {
        const [order] = await connection.query(
          `SELECT o.*, u.email 
           FROM orders o
           JOIN users u ON o.user_id = u.id
           WHERE o.id = ?`,
          [req.params.id]
        );
        
        if (order.length > 0 && order[0].email) {
          console.log('Sending payment confirmation to:', order[0].email);
          await sendPaymentConfirmation(order[0], order[0].email);
        } else {
          console.log('No email found for order:', req.params.id);
        }
      } catch (emailError) {
        console.error('Error sending payment confirmation email:', emailError);
        // Don't fail the whole request if email sending fails
      }
    }
    
    await connection.commit();
    console.log('Transaction committed');
    
    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error in status update:', error);
    if (connection) {
      try {
        await connection.rollback();
        console.log('Transaction rolled back');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (connection) {
      try {
        connection.release();
        console.log('Database connection released');
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
});

// Send order confirmation email
router.post('/send-confirmation', async (req, res) => {
  const { orderId, email } = req.body;
  
  if (!orderId || !email) {
    return res.status(400).json({
      success: false,
      message: 'Order ID and email are required'
    });
  }
  
  try {
    // Get the order details with items
    const [order] = await db.query(
      `SELECT o.*, 
              oi.id as item_id, oi.quantity, oi.price_per_unit,
              p.name as product_name, p.description as product_description
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.id = ?`,
      [orderId]
    );
    
    if (!order || order.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Format the order data
    const orderData = {
      id: order[0].id,
      user_id: order[0].user_id,
      total_price: order[0].total_price,
      status: order[0].status,
      created_at: order[0].created_at,
      items: order.map(item => ({
        id: item.item_id,
        product_id: item.product_id,
        name: item.product_name,
        description: item.product_description,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit
      }))
    };
    
    // Send the confirmation email
    const success = await sendOrderConfirmation(orderData, email);
    
    if (success) {
      res.json({
        success: true,
        message: 'Order confirmation email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send order confirmation email'
      });
    }
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send order confirmation',
      error: error.message
    });
  }
});

module.exports = router;

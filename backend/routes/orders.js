<<<<<<< HEAD
// backend/routes/orders.js
import express from "express";
import { pool } from "../db.js";
import { sendMail } from "../utils/mailer.js";
import { buildInvoiceHTML } from "../utils/invoice.js";
import { emitEvent } from "./events.js"; // 👈 مهم

const router = express.Router();

/** إرسال فاتورة بالبريد */
router.post("/:id/send-invoice", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { to } = req.body || {};
    const { html, toEmail, order } = await buildInvoiceHTML(id);

    const recipient = to || toEmail;
    if (!recipient) return res.status(400).json({ message: "No email" });

    const info = await sendMail({
      to: recipient,
      subject: `Invoice #${order.order_id} - H&Y Moda`,
      html,
      text: `Invoice for order #${order.order_id}`,
    });

    res.json({ ok: true, messageId: info.messageId });
  } catch (e) {
    next(e);
  }
});

/** GET /api/orders?user_id= */
router.get("/", async (req, res, next) => {
  try {
    const { user_id } = req.query;
    const params = [];
    let where = "";
    if (user_id) {
      where = "WHERE o.user_id = ?";
      params.push(user_id);
    }

    const [rows] = await pool.query(
      `
      SELECT 
        o.order_id, o.user_id, o.status, o.total_amount, o.order_date,
        u.username,
        (
          SELECT COALESCE(SUM(oi.quantity), 0)
          FROM order_items oi
          WHERE oi.order_id = o.order_id
        ) AS items_count
      FROM orders o
      JOIN users u ON u.user_id = o.user_id
      ${where}
      ORDER BY o.order_date DESC
      `,
      params
    );

    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/** مساعد: بثّ Low Stock لو الكمية قليلة */
async function emitLowStockIfNeeded(conn, product_id, color, size) {
  const threshold = Number(process.env.LOW_STOCK_THRESHOLD || 5);
  const [[row]] = await conn.query(
    `SELECT pv.product_id, pv.color, pv.size, pv.quantity, pv.price, p.product_name
       FROM product_variations pv
       JOIN products p ON p.product_id = pv.product_id
      WHERE pv.product_id=? AND pv.color=? AND pv.size=?`,
    [product_id, color, size]
  );
  if (row && Number(row.quantity) <= threshold) {
    emitEvent("stock.low", {
      product_id,
      color,
      size,
      quantity: Number(row.quantity),
      threshold,
      product_name: row.product_name,
    });
  }
}

/** POST /api/orders { user_id, items:[{product_id,color,size,quantity}] } */
router.post("/", async (req, res, next) => {
  let conn;
  try {
    const { user_id, items } = req.body;
    if (!user_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // احسب الإجمالي باستخدام VIEW variations
    let total = 0;
    for (const it of items) {
      const [vr] = await conn.query(
        `SELECT price FROM variations WHERE product_id=? AND color=? AND size=?`,
        [it.product_id, it.color, it.size]
      );
      if (!vr.length) {
        throw Object.assign(new Error("Variation not found"), { status: 400 });
      }
      const price = Number(vr[0].price || 0);
      total += price * Number(it.quantity || 0);
    }

    // أنشئ الطلبية
    const [ins] = await conn.query(
      `INSERT INTO orders (user_id, status, total_amount)
       VALUES (?, 'pending', ?)`,
      [user_id, total]
    );
    const order_id = ins.insertId;

    // أدخل بنود الطلب وخصم المخزون
    for (const it of items) {
      const [vr] = await conn.query(
        `SELECT price FROM variations WHERE product_id=? AND color=? AND size=?`,
        [it.product_id, it.color, it.size]
      );
      const unit = Number(vr[0].price || 0);

      await conn.query(
        `INSERT INTO order_items (order_id, product_id, color, size, quantity, unit_price)
         VALUES (?,?,?,?,?,?)`,
        [order_id, it.product_id, it.color, it.size, it.quantity, unit]
      );

      await conn.query(
        `UPDATE product_variations
            SET quantity = GREATEST(quantity - ?, 0)
          WHERE product_id=? AND color=? AND size=?`,
        [it.quantity, it.product_id, it.color, it.size]
      );

      // افحص تنبيه نقص المخزون بعد الخصم
      await emitLowStockIfNeeded(conn, it.product_id, it.color, it.size);
    }

    await conn.commit();

    // بعد نجاح العملية بثّ حدث طلبية جديدة
    emitEvent("order.created", { order_id, user_id, total_amount: total });

    res.json({ ok: true, order_id, total_amount: total });
  } catch (e) {
    try {
      if (conn) await conn.rollback();
    } catch {}
    next(e);
  } finally {
    try {
      if (conn) conn.release();
    } catch {}
  }
});

/** PUT /api/orders/:id { status } */
router.put("/:id", async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    const allowed = ["pending", "paid", "shipped", "cancelled"];
    if (!allowed.includes(String(status))) {
      return res.status(400).json({ message: "Invalid status" });
    }
    await pool.query(`UPDATE orders SET status=? WHERE order_id=?`, [
      status,
      id,
    ]);

    emitEvent("order.updated", { order_id: Number(id), status });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** GET /api/orders/:id — order + items */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const [orderRows] = await pool.query(
      `SELECT o.order_id, o.user_id, o.status, o.total_amount, o.order_date,
              u.username, u.email, u.address
         FROM orders o
         JOIN users u ON u.user_id = o.user_id
        WHERE o.order_id = ?`,
      [id]
    );
    if (!orderRows.length)
      return res.status(404).json({ message: "Order not found" });
    const order = orderRows[0];

    const [itemRows] = await pool.query(
      `SELECT oi.product_id, oi.color, oi.size, oi.quantity,
              COALESCE(oi.unit_price, v.price) AS unit_price,
              p.product_name, p.image_url
         FROM order_items oi
         JOIN products p ON p.product_id = oi.product_id
    LEFT JOIN variations v
           ON v.product_id = oi.product_id AND v.color = oi.color AND v.size = oi.size
        WHERE oi.order_id = ?`,
      [id]
    );

    const items = itemRows.map((r) => ({
      ...r,
      line_total: Number(r.unit_price || 0) * Number(r.quantity || 0),
    }));
    const subtotal = items.reduce((s, x) => s + x.line_total, 0);
    const shipping = 0;
    const tax = 0;
    const grand_total = subtotal + shipping + tax;

    res.json({
      order,
      items,
      summary: { subtotal, shipping, tax, grand_total },
    });
  } catch (e) {
    next(e);
  }
});

/** GET /api/orders/:id/invoice — printable HTML */
router.get("/:id/invoice", async (req, res, next) => {
  try {
    const { id } = req.params;

    const [oRows] = await pool.query(
      `SELECT o.order_id, o.user_id, o.status, o.total_amount, o.order_date,
              u.username, u.email, u.address
         FROM orders o
         JOIN users u ON u.user_id = o.user_id
        WHERE o.order_id = ?`,
      [id]
    );
    if (!oRows.length) return res.status(404).send("Not found");
    const o = oRows[0];

    const [rows] = await pool.query(
      `SELECT oi.product_id, oi.color, oi.size, oi.quantity,
              COALESCE(oi.unit_price, v.price) AS unit_price,
              p.product_name
         FROM order_items oi
         JOIN products p ON p.product_id = oi.product_id
    LEFT JOIN variations v
           ON v.product_id = oi.product_id AND v.color = oi.color AND v.size = oi.size
        WHERE oi.order_id = ?`,
      [id]
    );

    const items = rows.map((r) => ({
      ...r,
      line_total: Number(r.unit_price || 0) * Number(r.quantity || 0),
    }));
    const sub = items.reduce((s, x) => s + x.line_total, 0);
    const shipping = 0,
      tax = 0,
      total = sub + shipping + tax;

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Invoice #${o.order_id} - H&Y Moda</title>
<style>
  :root{ --pink:#ff7ab8; --ink:#2e2e2e; --muted:#7a7a7a; }
  body{ font-family: Inter, Arial, sans-serif; color:var(--ink); margin:24px; }
  .sheet{ width: 210mm; max-width: 100%; margin:0 auto; background:#fff; padding:24px; border:1px solid #f2c6dc; border-radius:16px; }
  .head{ display:flex; justify-content:space-between; align-items:flex-start; }
  .brand{ color:#d63384; font-weight:900; font-size:1.4rem; }
  .muted{ color:var(--muted); }
  h2{ margin:.2rem 0 0; }
  table{ width:100%; border-collapse:collapse; margin-top:16px; }
  th, td{ padding:10px; text-align:left; border-bottom:1px solid #f4d7e6; }
  th{ background:#fff1f7; }
  .right{ text-align:right; }
  .totals{ margin-top:12px; width: 320px; margin-left:auto; }
  .badge{ display:inline-block; padding:6px 10px; border-radius:999px; color:#fff; background:#d63384; font-weight:800; font-size:.85rem; text-transform:capitalize; }
  .print{ margin-top:14px; padding:10px 14px; border-radius:10px; border:none; background:#d63384; color:#fff; font-weight:900; }
  @media print{ .print{ display:none; } body{ margin:0; } .sheet{ border:none; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <div class="brand">H&Y Moda</div>
        <div class="muted">Invoice #${o.order_id}</div>
        <div class="muted">${new Date(o.order_date).toLocaleString()}</div>
      </div>
      <div>
        <div><b>Bill To</b></div>
        <div>${o.username}</div>
        <div class="muted">${o.email || ""}</div>
        <div class="muted">${o.address || ""}</div>
      </div>
    </div>

    <h2>Payment Invoice</h2>
    <div class="badge">${o.status}</div>

    <table>
      <thead>
        <tr>
          <th>Product</th><th>Color</th><th>Size</th>
          <th class="right">Qty</th><th class="right">Unit</th><th class="right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (r) => `
          <tr>
            <td>${r.product_name}</td>
            <td>${r.color}</td>
            <td>${r.size}</td>
            <td class="right">${r.quantity}</td>
            <td class="right">$${Number(r.unit_price || 0).toFixed(2)}</td>
            <td class="right">$${Number(r.line_total).toFixed(2)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <table class="totals">
      <tr><td>Subtotal</td><td class="right">$${sub.toFixed(2)}</td></tr>
      <tr><td>Shipping</td><td class="right">$${shipping.toFixed(2)}</td></tr>
      <tr><td>Tax</td><td class="right">$${tax.toFixed(2)}</td></tr>
      <tr><th>Total</th><th class="right">$${total.toFixed(2)}</th></tr>
    </table>

    <button class="print" onclick="window.print()">Print</button>
  </div>
</body>
</html>`;
    res.set("Content-Type", "text/html; charset=utf-8").send(html);
  } catch (e) {
    next(e);
  }
});

export default router;
=======
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
>>>>>>> 96d5d4fa470c5e3711e74096bc067efa4f6df75d

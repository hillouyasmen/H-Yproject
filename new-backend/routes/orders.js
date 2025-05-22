const express = require('express');
const router = express.Router();
const { Order, OrderDetail, Product, Cart, CartItem } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const { sequelize } = require('../config/db');

// Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: OrderDetail,
        include: [Product]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      },
      include: [{
        model: OrderDetail,
        include: [Product]
      }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

// Create order from cart
router.post('/', auth, async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { shipping_address } = req.body;

    // Get user's cart with items
    const cart = await Cart.findOne({
      where: { user_id: req.user.id },
      include: [{
        model: CartItem,
        include: [Product]
      }]
    });

    if (!cart || !cart.cart_items.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total and check stock
    let total = 0;
    for (const item of cart.cart_items) {
      if (item.quantity > item.product.stock) {
        await t.rollback();
        return res.status(400).json({
          message: `Not enough stock for ${item.product.name}`
        });
      }
      total += item.quantity * item.product.price;
    }

    // Create order
    const order = await Order.create({
      user_id: req.user.id,
      total,
      shipping_address,
      status: 'pending',
      payment_status: 'pending'
    }, { transaction: t });

    // Create order details and update product stock
    for (const item of cart.cart_items) {
      await OrderDetail.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price,
        total: item.quantity * item.product.price
      }, { transaction: t });

      // Update product stock
      await item.product.update({
        stock: item.product.stock - item.quantity
      }, { transaction: t });
    }

    // Clear cart
    await CartItem.destroy({
      where: { cart_id: cart.id },
      transaction: t
    });

    await t.commit();

    // Fetch complete order with details
    const completeOrder = await Order.findByPk(order.id, {
      include: [{
        model: OrderDetail,
        include: [Product]
      }]
    });

    res.status(201).json(completeOrder);
  } catch (error) {
    await t.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
});

// Admin: Update order status
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.update({ status });
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

// Admin: Get all orders
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{
        model: OrderDetail,
        include: [Product]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

module.exports = router;

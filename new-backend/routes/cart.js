const express = require('express');
const router = express.Router();
const { Cart, CartItem, Product } = require('../models');
const { auth } = require('../middleware/auth');

// Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({
      where: { user_id: req.user.id },
      include: [{
        model: CartItem,
        include: [Product]
      }]
    });

    if (!cart) {
      cart = await Cart.create({ user_id: req.user.id });
    }

    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart' });
  }
});

// Add item to cart
router.post('/items', auth, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    // Get or create cart
    let cart = await Cart.findOne({ where: { user_id: req.user.id } });
    if (!cart) {
      cart = await Cart.create({ user_id: req.user.id });
    }

    // Check if product exists and has enough stock
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      where: { cart_id: cart.id, product_id }
    });

    if (cartItem) {
      // Update quantity if item exists
      cartItem = await cartItem.update({
        quantity: cartItem.quantity + quantity
      });
    } else {
      // Create new cart item if it doesn't exist
      cartItem = await CartItem.create({
        cart_id: cart.id,
        product_id,
        quantity
      });
    }

    // Fetch updated cart item with product details
    cartItem = await CartItem.findByPk(cartItem.id, {
      include: [Product]
    });

    res.status(201).json(cartItem);
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ message: 'Error adding item to cart' });
  }
});

// Update cart item quantity
router.put('/items/:id', auth, async (req, res) => {
  try {
    const { quantity } = req.body;

    const cartItem = await CartItem.findOne({
      where: { id: req.params.id },
      include: [{ model: Cart, where: { user_id: req.user.id } }]
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Check product stock
    const product = await Product.findByPk(cartItem.product_id);
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    await cartItem.update({ quantity });

    const updatedCartItem = await CartItem.findByPk(cartItem.id, {
      include: [Product]
    });

    res.json(updatedCartItem);
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ message: 'Error updating cart item' });
  }
});

// Remove item from cart
router.delete('/items/:id', auth, async (req, res) => {
  try {
    const cartItem = await CartItem.findOne({
      where: { id: req.params.id },
      include: [{ model: Cart, where: { user_id: req.user.id } }]
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await cartItem.destroy();
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ message: 'Error removing item from cart' });
  }
});

// Clear cart
router.delete('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { user_id: req.user.id }
    });

    if (cart) {
      await CartItem.destroy({
        where: { cart_id: cart.id }
      });
    }

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Error clearing cart' });
  }
});

module.exports = router;

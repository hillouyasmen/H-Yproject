import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderHistory, setOrderHistory] = useState([]);

  useEffect(() => {
    fetchCart();
    fetchOrderHistory();
  }, []);

  const fetchCart = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const response = await axios.get(`http://localhost:5000/api/cart/${userId}`);
        setCartItems(response.data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderHistory = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const response = await axios.get(`http://localhost:5000/api/orders/${userId}`);
        setOrderHistory(response.data);
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User not logged in');
      }

      await axios.post(`http://localhost:5000/api/cart/${userId}/item`, {
        productId: product._id,
        quantity
      });

      fetchCart(); // Refresh cart after adding item
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const createOrder = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User not logged in');
      }

      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      const orderData = {
        items: cartItems,
        total: cartItems.reduce((sum, item) => 
          sum + (item.productId.price * (1 - item.productId.discount / 100) * item.quantity), 0
        ),
        userId
      };

      await axios.post('http://localhost:5000/api/orders', orderData);
      
      // Clear cart after order creation
      await axios.delete(`http://localhost:5000/api/cart/${userId}`);
      setCartItems([]);
      
      // Refresh order history
      fetchOrderHistory();
      
      return true;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const userId = localStorage.getItem('userId');
      await axios.delete(`http://localhost:5000/api/cart/${userId}/item/${itemId}`);
      fetchCart(); // Refresh cart after removing item
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const userId = localStorage.getItem('userId');
      await axios.put(`http://localhost:5000/api/cart/${userId}/item/${itemId}`, {
        quantity
      });
      fetchCart(); // Refresh cart after updating quantity
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      const userId = localStorage.getItem('userId');
      await axios.delete(`http://localhost:5000/api/cart/${userId}`);
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.productId.price * (1 - item.productId.discount / 100);
      return total + price * item.quantity;
    }, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;

CartContext.displayName = 'CartContext';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { fetchApi } from '../utils/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();

  // Cart open/close
  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);

  // Fetch user's cart from server
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setCartItems([]);
      return;
    }
    try {
      setIsLoading(true);
      const url = `/orders/user/${user.id}?status=pending`;
      const response = await fetchApi(url);
      if (response?.success && Array.isArray(response.data) && response.data[0]?.items) {
        const order = response.data[0];
        const items = order.items.map(item => ({
          id: item.product_id || item.id,
          name: item.product_name || item.name || 'Unnamed Product',
          price: parseFloat(item.price_per_unit || item.price || 0),
          quantity: parseInt(item.quantity || 1, 10),
          image: item.image_url || item.image || ''
        }));
        setCartItems(items);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      setCartItems([]);
      showNotification('Failed to load cart', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, showNotification]);

  // Remove item from cart
  const removeFromCart = useCallback(async (productId) => {
    try {
      setIsLoading(true);
      const ordersResponse = await fetchApi(`/orders/user/${user.id}?status=pending`);
      if (!ordersResponse?.success || !ordersResponse.data?.[0]) throw new Error('No pending order');
      const order = ordersResponse.data[0];
      const orderItem = order.items?.find(item => item.product_id === productId);
      if (!orderItem) throw new Error('Item not in cart');
      await fetchApi(`/orders/${order.id}/items/${orderItem.id}`, { method: 'DELETE' });
      // Update UI optimistically:
      setCartItems(items => items.filter(item => item.id !== productId));
      showNotification('Item removed from cart', 'success', 3000);
      await fetchCart();
      return true;
    } catch (error) {
      showNotification(error.message || 'Failed to remove item', 'error', 3000);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fetchCart, showNotification]);

  // Update cart item quantity
  const updateCartItemQuantity = useCallback(async (productId, newQuantity) => {
    if (newQuantity < 1) {
      return await removeFromCart(productId);
    }
    try {
      setIsLoading(true);
      const ordersResponse = await fetchApi(`/orders/user/${user.id}?status=pending`);
      if (!ordersResponse?.success || !ordersResponse.data?.[0]) throw new Error('No pending order');
      const order = ordersResponse.data[0];
      const orderItem = order.items?.find(item => item.product_id === productId);
      if (!orderItem) throw new Error('Item not in cart');
      await fetchApi(`/orders/${order.id}/items/${orderItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity })
      });
      // Optimistic update:
      setCartItems(items =>
        items.map(item =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
      await fetchCart();
      showNotification('Quantity updated', 'success', 3000);
      return true;
    } catch (error) {
      showNotification(error.message || 'Failed to update quantity', 'error', 3000);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fetchCart, showNotification, removeFromCart]);

  // Add to cart
  const addToCart = useCallback(async (product, quantity = 1) => {
    try {
      if (!isAuthenticated) throw new Error('Please log in to add items to cart');
      if (!product || !product.id) throw new Error('Invalid product');
      setIsLoading(true);

      // Optimistic UI: show product instantly
      setCartItems(items => {
        const exist = items.find(item => item.id === product.id);
        if (exist) {
          // Already exists, just update quantity for now
          return items.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          // New product
          return [
            ...items,
            {
              id: product.id,
              name: product.name,
              price: parseFloat(product.price),
              quantity: Math.max(1, parseInt(quantity, 10)),
              image: product.image || ''
            }
          ];
        }
      });

      // Real API logic
      const ordersResponse = await fetchApi(`/orders/user/${user.id}?status=pending`);
      let orderId;
      if (ordersResponse?.success && ordersResponse.data?.[0]?.id) {
        // Update existing order
        orderId = ordersResponse.data[0].id;
        const existing = ordersResponse.data[0].items?.find(
          item => item.product_id === product.id
        );
        if (existing) {
          await updateCartItemQuantity(product.id, existing.quantity + quantity);
        } else {
          // Add item to existing order
          await fetchApi(`/orders/${orderId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: product.id,
              quantity: Math.max(1, parseInt(quantity, 10)),
              price_per_unit: parseFloat(product.price),
              product_name: product.name,
              image_url: product.image || ''
            })
          });
        }
      } else {
        // Create new order
        const newOrderResponse = await fetchApi('/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            items: [
              {
                product_id: product.id,
                quantity: Math.max(1, parseInt(quantity, 10)),
                price_per_unit: parseFloat(product.price),
                product_name: product.name,
                image_url: product.image || ''
              }
            ],
            status: 'pending',
            total_amount: (parseFloat(product.price) || 0) * Math.max(1, parseInt(quantity, 10))
          })
        });
        orderId = newOrderResponse.data?.id;
      }

      // Fetch updated cart
      await fetchCart();
      showNotification(`${product.name} added to cart`, 'success', 3000);
      return true;
    } catch (error) {
      showNotification(error.message || 'Failed to add to cart', 'error', 3000);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, fetchCart, showNotification, updateCartItemQuantity]);

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchApi(`/orders/user/${user.id}?status=pending`);
      if (response?.success && response.data?.[0]?.id) {
        await fetchApi(`/orders/${response.data[0].id}`, { method: 'DELETE' });
      }
      setCartItems([]);
      showNotification('Cart cleared', 'success', 3000);
    } catch (error) {
      showNotification('Failed to clear cart', 'error', 3000);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, showNotification]);

  // Get cart total
  const getCartTotal = useCallback(
    () => cartItems.reduce((total, item) => total + (item.price * item.quantity), 0),
    [cartItems]
  );

  // Get item count
  const getItemCount = useCallback(
    () => cartItems.reduce((count, item) => count + item.quantity, 0),
    [cartItems]
  );

  // Always fetch cart when login/logout changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchCart();
    } else {
      setCartItems([]);
    }
  }, [isAuthenticated, user?.id, fetchCart]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isLoading,
        isCartOpen,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        getCartTotal,
        getItemCount,
        fetchCart,
        toggleCart,
        closeCart,
        openCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;

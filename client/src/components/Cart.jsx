import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProductImage } from '../utils/imageUtils';
import '../styles/Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    cartItems, 
    removeFromCart, 
    updateCartItemQuantity, 
    getCartTotal,
    isCartOpen,
    closeCart,
    fetchCart
  } = useCart();
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refresh cart when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const handleQuantityChange = async (productId, newQuantity) => {
    try {
      setIsProcessing(true);
      if (newQuantity < 1) {
        await removeFromCart(productId);
      } else {
        await updateCartItemQuantity(productId, newQuantity);
      }
      toast.success('Cart updated');
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error(error.message || 'Failed to update cart');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle cart open/close and body scroll
  useEffect(() => {
    const overlay = document.querySelector('.cart-overlay');
    if (overlay) {
      overlay.classList.toggle('active', isCartOpen);
    }
    
    // Prevent body scroll when cart is open
    document.body.style.overflow = isCartOpen ? 'hidden' : 'auto';
    
    // Refresh cart when cart is opened
    if (isCartOpen && isAuthenticated) {
      fetchCart();
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isCartOpen, isAuthenticated, fetchCart]);

  const handleClose = (e) => {
    e.preventDefault();
    closeCart();
  };

  // Handle checkout
  const handleCheckout = () => {
    if (!isAuthenticated) {
      closeCart();
      navigate('/login', { state: { from: 'checkout' } });
      toast.info('Please log in to proceed to checkout');
      return;
    }
    
    if (cartItems.length === 0) {
      toast.warning('Your cart is empty');
      return;
    }
    
    closeCart();
    navigate('/checkout');
  };

  if (!isCartOpen) return null;

  return (
    <div className="cart-overlay" onClick={handleClose}>
      <div className="cart-content" onClick={e => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Your Shopping Bag</h2>
          <button className="close-button" onClick={handleClose} aria-label="Close cart">
            <span>×</span>
          </button>
        </div>
        
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <button className="btn" onClick={handleClose}>Continue Shopping</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={`${item.id}-${item.quantity}`} className="cart-item">
                  <div className="item-image">
                    <img 
                      src={getProductImage(item.image)} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `${process.env.PUBLIC_URL}/images/placeholder-product.jpg`;
                      }}
                      loading="lazy"
                    />
                  </div>
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p className="price">₪{item.price.toFixed(2)} x {item.quantity}</p>
                    <p className="subtotal">Subtotal: ₪{(item.price * item.quantity).toFixed(2)}</p>
                    <div className="item-actions">
                      <div className="quantity-controls">
                        <button 
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={isProcessing}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={isProcessing}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        className="remove-item"
                        onClick={() => removeFromCart(item.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items):</span>
                <span>₪{getCartTotal().toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping:</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="total">
                <span>Estimated Total:</span>
                <span>₪{getCartTotal().toFixed(2)}</span>
              </div>
              <button 
                className="btn checkout-btn"
                onClick={handleCheckout}
                disabled={isProcessing || cartItems.length === 0}
              >
                {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
              </button>
              <p className="secure-checkout">
                <i className="lock-icon">🔒</i> Secure Checkout
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;

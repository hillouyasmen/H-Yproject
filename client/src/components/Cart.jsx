import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useCart } from '../context/CartContext';
import { getProductImage } from '../utils/imageUtils';
import '../styles/Cart.css';

const Cart = ({ onClose }) => {
  const navigate = useNavigate();
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    getCartTotal
  } = useCart();

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    updateQuantity(productId, newQuantity);
  };

  // Add active class when cart is open
  useEffect(() => {
    const overlay = document.querySelector('.cart-overlay');
    if (overlay) {
      overlay.classList.add('active');
    }
    
    // Prevent body scroll when cart is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleClose = (e) => {
    e.preventDefault();
    const overlay = document.querySelector('.cart-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      // Wait for the animation to complete before calling onClose
      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      onClose();
    }
  };

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
            <button className="btn" onClick={onClose}>Continue Shopping</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <img 
                    src={getProductImage(item.imageUrl)} 
                    alt={item.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `${process.env.PUBLIC_URL}/images/placeholder-product.jpg`;
                    }}
                  />
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p>₪{item.price} x {item.quantity}</p>
                    <div className="quantity-controls">
                      <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <button 
                      className="remove-item"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="cart-summary">
              <div className="total">
                <span>Total:</span>
                <span>₪{getCartTotal().toFixed(2)}</span>
              </div>
              <button 
                className="btn checkout-btn"
                onClick={() => {
                  onClose(); // Close the cart
                  navigate('/checkout'); // Navigate to checkout page
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, loading, updateQuantity, removeFromCart, getCartTotal } = useCart();

  const proceedToCheckout = () => {
    navigate('/checkout', { state: { cartItems, total: getCartTotal() } });
  };

  return (
    <div className="cart-container">
      <h2>העגלה שלך</h2>
      {loading ? (
        <div className="loading-spinner" />
      ) : cartItems.length === 0 ? (
        <p>העגלה ריקה</p>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.productId._id} className="cart-item">
                <img src={item.productId.image} alt={item.productId.name} />
                <div className="item-details">
                  <h3>{item.productId.name}</h3>
                  <p>מחיר: ₪{(item.productId.price * (1 - item.productId.discount / 100)).toFixed(2)}</p>
                  <div className="quantity-controls">
                    <button 
                      onClick={() => updateQuantity(item.productId._id, item.quantity - 1)} 
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button 
                    className="remove-btn" 
                    onClick={() => removeFromCart(item.productId._id)}
                  >
                    הסר מהעגלה
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>סיכום הזמנה</h3>
            <p>סה"כ: ₪{getCartTotal().toFixed(2)}</p>
            <button className="checkout-btn" onClick={proceedToCheckout}>
              המשך לתשלום
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;

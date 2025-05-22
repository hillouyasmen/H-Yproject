import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import '../styles/Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const total = getCartTotal();
  
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '',
    address: '',
    city: '',
    zipCode: '',
    phone: ''
  });

  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: ''
  });

  const handleShippingChange = (e) => {
    setShippingDetails({
      ...shippingDetails,
      [e.target.name]: e.target.value
    });
  };

  const handlePaymentChange = (e) => {
    setPaymentDetails({
      ...paymentDetails,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('userId');
      const orderData = {
        userId,
        items: cartItems,
        total,
        shippingDetails,
        status: 'pending'
      };

      // Create order
      const response = await axios.post('http://localhost:5000/api/orders', orderData);
      
      // Clear cart after successful order
      await clearCart();
      
      // Navigate to order confirmation
      navigate('/order-confirmation', { 
        state: { 
          orderId: response.data._id,
          total: total 
        }
      });
    } catch (error) {
      console.error('Error creating order:', error);
      alert('אירעה שגיאה בעת יצירת ההזמנה. אנא נסה שוב.');
    }
  };

  return (
    <div className="checkout-container">
      <h2>סיום הזמנה</h2>
      <div className="checkout-content">
        <div className="order-summary">
          <h3>סיכום הזמנה</h3>
          {cartItems.map((item) => (
            <div key={item.productId._id} className="summary-item">
              <span>{item.productId.name} x {item.quantity}</span>
              <span>₪{(item.productId.price * (1 - item.productId.discount / 100) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="total">
            <strong>סה"כ לתשלום: </strong>
            <strong>₪{total.toFixed(2)}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="shipping-section">
            <h3>פרטי משלוח</h3>
            <input
              type="text"
              name="fullName"
              placeholder="שם מלא"
              value={shippingDetails.fullName}
              onChange={handleShippingChange}
              required
            />
            <input
              type="text"
              name="address"
              placeholder="כתובת"
              value={shippingDetails.address}
              onChange={handleShippingChange}
              required
            />
            <input
              type="text"
              name="city"
              placeholder="עיר"
              value={shippingDetails.city}
              onChange={handleShippingChange}
              required
            />
            <input
              type="text"
              name="zipCode"
              placeholder="מיקוד"
              value={shippingDetails.zipCode}
              onChange={handleShippingChange}
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="טלפון"
              value={shippingDetails.phone}
              onChange={handleShippingChange}
              required
            />
          </div>

          <div className="payment-section">
            <h3>פרטי תשלום</h3>
            <input
              type="text"
              name="cardNumber"
              placeholder="מספר כרטיס"
              value={paymentDetails.cardNumber}
              onChange={handlePaymentChange}
              maxLength="16"
              required
            />
            <div className="card-details">
              <input
                type="text"
                name="expiryDate"
                placeholder="MM/YY"
                value={paymentDetails.expiryDate}
                onChange={handlePaymentChange}
                maxLength="5"
                required
              />
              <input
                type="text"
                name="cvv"
                placeholder="CVV"
                value={paymentDetails.cvv}
                onChange={handlePaymentChange}
                maxLength="3"
                required
              />
            </div>
            <input
              type="text"
              name="cardHolderName"
              placeholder="שם בעל הכרטיס"
              value={paymentDetails.cardHolderName}
              onChange={handlePaymentChange}
              required
            />
          </div>

          <button type="submit" className="place-order-btn">
            בצע הזמנה
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;

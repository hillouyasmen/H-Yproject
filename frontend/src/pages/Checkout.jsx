import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import '../styles/Checkout.css';

// Initialize Stripe with public key
const stripePromise = loadStripe('pk_test_51O5JYqJVvtjKxxx9Ky7Xt4CgEQBPBQTjXGPGXMbYWwPxjGVHNkH1vkNYqyQZ2Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8');

// You should replace the above key with your actual Stripe publishable key
// const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

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

  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);
    
    try {
      const stripe = await stripePromise;
      
      // Create order
      const userId = localStorage.getItem('userId');
      const orderData = {
        userId,
        items: cartItems,
        total,
        shippingDetails,
        status: 'pending'
      };

      // Create order in database
      const orderResponse = await axios.post('/api/orders', orderData);
      const orderId = orderResponse.data.id;

      // Create payment intent
      const paymentResponse = await axios.post('/api/payments/create-payment-intent', {
        amount: total
      });

      // Confirm payment with Stripe
      const { error } = await stripe.confirmCardPayment(paymentResponse.data.clientSecret, {
        payment_method: {
          card: {
            number: paymentDetails.cardNumber,
            exp_month: parseInt(paymentDetails.expiryDate.split('/')[0]),
            exp_year: parseInt(paymentDetails.expiryDate.split('/')[1]),
            cvc: paymentDetails.cvv,
          },
          billing_details: {
            name: paymentDetails.cardHolderName,
            address: {
              line1: shippingDetails.address,
              city: shippingDetails.city,
              postal_code: shippingDetails.zipCode,
            },
          },
        },
      });

      if (error) {
        setError(error.message);
        setIsProcessing(false);
        return;
      }

      // Confirm payment in our backend
      await axios.post('/api/payments/confirm', {
        orderId,
        paymentIntentId: paymentResponse.data.clientSecret.split('_secret')[0],
      });

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
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      {isProcessing && (
        <div className="processing-message">
          Processing your payment...
        </div>
      )}
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

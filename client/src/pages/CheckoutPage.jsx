import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getProductImage } from '../utils/imageUtils';
import { FaLock, FaMapMarkerAlt, FaCreditCard, FaUser, FaCheckCircle } from 'react-icons/fa';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useNotification();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    country: user?.country || '',
    zipCode: user?.zipCode || '',
    paymentMethod: 'credit_card',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    saveInfo: false
  });
  
  const fillTestData = () => {
    setFormData({
      ...formData,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '0501234567',
      address: '123 Test St',
      city: 'Test City',
      country: 'Israel',
      zipCode: '12345',
      cardNumber: '4242424242424242',
      cardName: 'Test User',
      expiryDate: '12/25',
      cvv: '123'
    });
    showInfo('Test data filled. You can now test the checkout process.', 5000);
  };
  

  
  // Calculate cart total
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 10.00 : 0; // $10 flat rate shipping
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + shipping + tax;
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const validateForm = useCallback(() => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || 
        !formData.address || !formData.city || !formData.country || !formData.zipCode) {
      showError('Please fill in all required fields');
      return false;
    }
    
    if (formData.paymentMethod === 'credit_card' && 
        (!formData.cardNumber || !formData.cardName || !formData.expiryDate || !formData.cvv)) {
      showError('Please fill in all payment details');
      return false;
    }
    
    return true;
  }, [formData, showError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (cartItems.length === 0) {
      setError('Your cart is empty');
      showError('Your cart is empty');
      return;
    }
    
    setIsSubmitting(true);
    
    setLoading(true);
    
    try {
      // Prepare order items for backend
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price_per_unit: item.price,
        name: item.name,
        image_url: item.imageUrl ? item.imageUrl.split('/').pop() : ''
      }));

      // Create order data for backend
      const orderData = {
        user_id: user?.id,
        total_amount: total,
        status: 'pending',  // Changed from 'pending_payment' to 'pending'
        items: orderItems,
        shipping_address: `${formData.address}, ${formData.city}, ${formData.country} ${formData.zipCode}`,
        payment_method: formData.paymentMethod,
        customer_name: `${formData.firstName} ${formData.lastName}`,
        customer_email: formData.email,
        customer_phone: formData.phone
      };
      
      console.log('Sending order data:', orderData);
      
      // 1. First create the order in the database
      const orderResponse = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      });

      let orderResult;
      try {
        orderResult = await orderResponse.json();
        console.log('Order creation response:', orderResult);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Invalid response from server');
      }
      
      if (!orderResponse.ok) {
        const errorMsg = orderResult?.message || `Failed to create order (${orderResponse.status})`;
        console.error('Order creation failed:', errorMsg);
        throw new Error(errorMsg);
      }
      
      // Extract order ID from the response
      const orderId = orderResult.id || orderResult.orderId;

      // In a real app, you would process payment here
      // For now, we'll simulate order processing
      console.log('Simulating order processing for order:', orderId);
      
      // Update order status to 'processing' after successful order creation
      const updateResponse = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'processing' })  // Changed from 'paid' to 'processing'
      });

      if (!updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.error('Failed to update order status:', updateResult);
        throw new Error(updateResult.message || 'Failed to update order status');
      }

      // Save order details and show success state
      setOrderDetails(orderResult);
      setOrderSuccess(true);
      clearCart();
      
      // Show success notification
      showSuccess('Order placed successfully!', 5000);
      
      // Auto-redirect to profile after delay
      setTimeout(() => {
        navigate('/profile');
      }, 5000);
      
    } catch (err) {
      console.error('Error placing order:', err);
      const errorMessage = err.response?.data?.message || 'Failed to place order. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (cartItems.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Add some items to your cart before checking out.</p>
        <button 
          onClick={() => navigate('/products')} 
          className="btn btn-primary"
        >
          Continue Shopping
        </button>
      </div>
    );
  }
  
  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <div className="secure-checkout">
          <FaLock />
          <span>Secure Checkout</span>
        </div>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="checkout-content">
        <div className="checkout-form-container">
          <form onSubmit={handleSubmit} className="checkout-form">
            {/* Contact Information */}
            <div className="form-section">
              <h2><FaUser /> Contact Information</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input 
                    type="text" 
                    name="firstName" 
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input 
                    type="text" 
                    name="lastName" 
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Phone *</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              
              <div className="form-check">
                <input 
                  type="checkbox" 
                  id="saveInfo" 
                  name="saveInfo"
                  checked={formData.saveInfo}
                  onChange={handleInputChange}
                />
                <label htmlFor="saveInfo">Save this information for next time</label>
              </div>
            </div>
            
            {/* Shipping Address */}
            <div className="form-section">
              <h2><FaMapMarkerAlt /> Shipping Address</h2>
              <div className="form-group">
                <label>Address *</label>
                <input 
                  type="text" 
                  name="address" 
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street address"
                  required 
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input 
                    type="text" 
                    name="city" 
                    value={formData.city}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Country *</label>
                  <select 
                    name="country" 
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="IL">Israel</option>
                    {/* Add more countries as needed */}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>ZIP/Postal Code *</label>
                <input 
                  type="text" 
                  name="zipCode" 
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  required 
                />
              </div>
            </div>
            
            {/* Payment Method */}
            <div className="form-section">
              <h2><FaCreditCard /> Payment Method</h2>
              
              <div className="payment-methods">
                <label className="payment-method">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="credit_card"
                    checked={formData.paymentMethod === 'credit_card'}
                    onChange={handleInputChange}
                  />
                  <span>Credit Card</span>
                </label>
                
                <label className="payment-method">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="paypal"
                    checked={formData.paymentMethod === 'paypal'}
                    onChange={handleInputChange}
                  />
                  <span>PayPal</span>
                </label>
              </div>
              
              {formData.paymentMethod === 'credit_card' && (
                <div className="credit-card-form">
                  <div className="form-group">
                    <label>Card Number *</label>
                    <input 
                      type="text" 
                      name="cardNumber" 
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Name on Card *</label>
                    <input 
                      type="text" 
                      name="cardName" 
                      value={formData.cardName}
                      onChange={handleInputChange}
                      placeholder="John Smith"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date *</label>
                      <input 
                        type="text" 
                        name="expiryDate" 
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>CVV *</label>
                      <input 
                        type="text" 
                        name="cvv" 
                        value={formData.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {formData.paymentMethod === 'paypal' && (
                <div className="paypal-notice">
                  <p>You will be redirected to PayPal to complete your purchase securely.</p>
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => navigate('/cart')}
              >
                Back to Cart
              </button>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="order-summary">
          <h3>Order Summary</h3>
          
          <div className="order-items">
            {cartItems.map(item => (
              <div key={item.id} className="order-item">
                <div className="item-image">
                  <img 
                    src={getProductImage(item.imageUrl)} 
                    alt={item.name} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `${process.env.PUBLIC_URL}/images/placeholder-product.jpg`;
                    }}
                  />
                  <span className="item-quantity">{item.quantity}</span>
                </div>
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p>${item.price.toFixed(2)}</p>
                </div>
                <div className="item-price">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Shipping</span>
              <span>{shipping > 0 ? `$${shipping.toFixed(2)}` : 'Free'}</span>
            </div>
            <div className="total-row">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="secure-checkout-footer">
            <FaLock />
            <span>Secure Checkout</span>
            <p>Your payment information is encrypted and secure.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

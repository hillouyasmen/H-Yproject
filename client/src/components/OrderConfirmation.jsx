import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaShoppingBag, FaCreditCard, FaShippingFast, FaHome } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('processing');
  
  // Extract orderId from URL or location state
  const orderId = new URLSearchParams(location.search).get('orderId') || 
                 (location.state && location.state.orderId);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('No order ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }

        const data = await response.json();
        setOrder(data.data);
        
        // Simulate payment processing
        const timer = setTimeout(() => {
          setPaymentStatus('completed');
          // Update order status in the backend
          updateOrderStatus(orderId, 'processing');
        }, 3000);

        return () => clearTimeout(timer);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Send order confirmation email
      await fetch('http://localhost:5000/api/orders/send-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ orderId, email: user?.email })
      });

    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  if (loading) {
    return (
      <div className="order-confirmation loading">
        <div className="spinner"></div>
        <h2>Processing your order...</h2>
        <p>Please wait while we confirm your payment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-confirmation error">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="order-confirmation">
      {paymentStatus === 'completed' ? (
        <>
          <div className="confirmation-header success">
            <FaCheckCircle className="success-icon" />
            <h1>Thank You for Your Order!</h1>
            <p>Your order has been received and is being processed.</p>
            <div className="order-number">Order #: {order?.id}</div>
          </div>

          <div className="order-details">
            <h2>Order Details</h2>
            <div className="order-summary">
              <div className="summary-row">
                <span>Order Number:</span>
                <span>#{order?.id}</span>
              </div>
              <div className="summary-row">
                <span>Date:</span>
                <span>{new Date(order?.created_at).toLocaleDateString()}</span>
              </div>
              <div className="summary-row">
                <span>Total:</span>
                <span>${order?.total_price?.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Payment Method:</span>
                <span>Credit Card</span>
              </div>
            </div>

            <div className="shipping-address">
              <h3>Shipping Address</h3>
              <p>{user?.full_name}</p>
              <p>{user?.address}</p>
              <p>{user?.phone}</p>
            </div>

            <div className="order-timeline">
              <div className={`timeline-step ${paymentStatus === 'completed' ? 'active' : ''}`}>
                <div className="step-icon">
                  <FaShoppingBag />
                </div>
                <div className="step-label">Order Placed</div>
              </div>
              <div className={`timeline-step ${paymentStatus === 'completed' ? 'active' : ''}`}>
                <div className="step-icon">
                  <FaCreditCard />
                </div>
                <div className="step-label">Payment Confirmed</div>
              </div>
              <div className="timeline-step">
                <div className="step-icon">
                  <FaShippingFast />
                </div>
                <div className="step-label">Shipped</div>
              </div>
              <div className="timeline-step">
                <div className="step-icon">
                  <FaHome />
                </div>
                <div className="step-label">Delivered</div>
              </div>
            </div>
          </div>

          <div className="order-actions">
            <button onClick={handleContinueShopping} className="btn btn-primary">
              Continue Shopping
            </button>
            <button 
              onClick={() => navigate(`/profile/orders/${order?.id}`)}
              className="btn btn-outline"
            >
              View Order Details
            </button>
          </div>
        </>
      ) : (
        <div className="payment-processing">
          <div className="spinner"></div>
          <h2>Processing Payment...</h2>
          <p>Please wait while we confirm your payment details.</p>
          <p>Do not refresh or close this page.</p>
        </div>
      )}
    </div>
  );
};

export default OrderConfirmation;

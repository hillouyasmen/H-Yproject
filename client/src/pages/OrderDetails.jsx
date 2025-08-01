import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getProductImage } from '../utils/imageUtils';
import { 
  FaArrowLeft, 
  FaBoxOpen, 
  FaTruck, 
  FaCheckCircle, 
  FaTimesCircle,
  FaMoneyBillWave,
  FaCreditCard,
  FaMapMarkerAlt,
  FaClock
} from 'react-icons/fa';
import { API_BASE_URL } from '../config';
import './OrderDetails.css';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { showError } = useNotification();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }
        
        const data = await response.json();
        setOrder(data);
        setStatus(data.status);
      } catch (error) {
        console.error('Error fetching order:', error);
        showError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, showError]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
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
      
      const updatedOrder = await response.json();
      setOrder(updatedOrder);
    } catch (error) {
      console.error('Error updating order status:', error);
      showError('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    // Default to 'pending' if status is not provided
    const statusValue = status || 'pending';
    
    const statusMap = {
      'pending': { color: 'warning', icon: <FaClock />, label: 'Pending' },
      'processing': { color: 'info', icon: <FaBoxOpen />, label: 'Processing' },
      'shipped': { color: 'primary', icon: <FaTruck />, label: 'Shipped' },
      'delivered': { color: 'success', icon: <FaCheckCircle />, label: 'Delivered' },
      'cancelled': { color: 'danger', icon: <FaTimesCircle />, label: 'Cancelled' },
      'completed': { color: 'success', icon: <FaCheckCircle />, label: 'Completed' }
    };
    
    // Convert status to lowercase and handle undefined/null
    const statusKey = String(statusValue).toLowerCase();
    const statusInfo = statusMap[statusKey] || { 
      color: 'secondary', 
      icon: <FaBoxOpen />, 
      label: statusValue || 'Unknown' 
    };
    
    return (
      <span className={`status-badge ${statusInfo.color}`}>
        {statusInfo.icon}
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Loading order details...</div>;
  }

  if (!order) {
    return <div className="error">Order not found</div>;
  }

  return (
    <div className="order-details-container">
      <div className="order-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back to Orders
        </button>
        <h2>Order #{order.id}</h2>
        <div className="order-status">
          {getStatusBadge(order.status)}
          <span className="order-date">
            Placed on {new Date(order.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      <div className="order-content">
        <div className="order-section">
          <h3>Order Summary</h3>
          <div className="order-items">
            {order.items?.map((item) => (
              <div key={item.id} className="order-item">
                <img 
                  src={getProductImage(item.image_url)} 
                  alt={item.name} 
                  className="item-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `${process.env.PUBLIC_URL}/images/placeholder-product.jpg`;
                  }}
                />
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p>Quantity: {item.quantity}</p>
                  <p>${item.price_per_unit?.toFixed(2)} each</p>
                </div>
                <div className="item-total">
                  ${(item.quantity * item.price_per_unit)?.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>${order.total_amount?.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Shipping</span>
              <span>$0.00</span>
            </div>
            <div className="total-row grand-total">
              <span>Total</span>
              <span>${order.total_amount?.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="order-info-grid">
          <div className="info-card shipping-address">
            <h3><FaMapMarkerAlt /> Shipping Address</h3>
            <p>{order.shipping_address}</p>
          </div>
          
          <div className="info-card payment-method">
            <h3><FaCreditCard /> Payment Method</h3>
            <p>{order.payment_method === 'credit_card' ? 'Credit Card' : 'Cash on Delivery'}</p>
            <p>Status: <span className={`payment-status ${order.payment_status || 'pending'}`}>
              {order.payment_status || 'Pending'}
            </span></p>
          </div>
          
          {isAdmin && (
            <div className="info-card admin-actions">
              <h3>Admin Actions</h3>
              <form onSubmit={handleStatusUpdate}>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="status-select"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button 
                  type="submit" 
                  className="btn primary"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

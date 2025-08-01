
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getProductImage } from '../utils/imageUtils';
import { 
  FaUser, 
  FaShoppingBag, 
  FaHistory, 
  FaSignOutAlt, 
  FaEdit, 
  FaCheck, 
  FaTimes, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope, 
  FaUserEdit,
  FaBoxOpen,
  FaTruck,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa';
import { format } from 'date-fns';
import { API_BASE_URL } from '../config';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const { showSuccess, showError } = useNotification();
  
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }
      
      // Update the orders list to reflect the cancellation
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelled' } 
            : order
        )
      );
      
      showSuccess('Order has been cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      showError('Failed to cancel order. Please try again.');
    }
  };

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || ''
  });

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setOrderLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/orders/user/${user.id}?includeItems=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const result = await response.json();
      // Handle both response formats for backward compatibility
      const ordersData = Array.isArray(result) ? result : (result.data || []);
      setOrders(ordersData);
    } catch (err) {
      console.error('Error fetching orders:', err);
      showError('Failed to load orders. Please try again later.');
    } finally {
      setOrderLoading(false);
      setLoading(false);
    }
  }, [user?.id, showError]);
  
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you would send this data to your backend
    console.log('Updating profile:', formData);
    setIsEditing(false);
    // Show success message
    alert('Your profile has been updated successfully!');
  };

  const handleLogout = () => {
    logout();
    showSuccess('You have been logged out successfully');
    navigate('/login');
  };
  
  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <FaClock className="status-icon pending" />;
      case 'processing':
        return <FaTruck className="status-icon processing" />;
      case 'completed':
        return <FaCheckCircle className="status-icon completed" />;
      case 'cancelled':
        return <FaTimes className="status-icon cancelled" />;
      default:
        return <FaBoxOpen className="status-icon" />;
    }
  };
  
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy - h:mm a');
    } catch (e) {
      return 'N/A';
    }
  };

  const getStatusBadge = (status) => {
    const statusText = status.replace(/_/g, ' ');
    const statusClass = status.toLowerCase().replace(/_/g, '-');
    
    return <span className={`status-badge ${statusClass}`}>
      {statusText.charAt(0).toUpperCase() + statusText.slice(1)}
    </span>;
  };

  if (!user) {
    return (
      <div className="not-logged-in">
        <div className="auth-prompt">
          <div className="auth-icon">
            <FaUser size={48} />
          </div>
          <h2>Welcome, Guest</h2>
          <p>Please log in to access your profile and order history.</p>
          <div className="auth-actions">
            <button className="btn primary" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="btn secondary" onClick={() => navigate('/register')}>
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
          {isEditing && (
            <button className="btn btn-primary edit-avatar-btn">
              <FaUserEdit />
              <span>Edit Photo</span>
            </button>
          )}
        </div>
        <div className="profile-info">
          <h1>{formData.fullName}</h1>
          <p className="member-since">Member since {new Date(user.createdAt || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt /> Logout
        </button>
      </div>

      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <FaUser /> Profile
        </button>
        <button 
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <FaShoppingBag /> My Orders
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FaHistory /> Order History
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'profile' ? (
          <div className="profile-details">
            <div className="section-header">
              <h2>Profile Information</h2>
              {!isEditing ? (
                <button 
                  className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <FaEdit /> {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                </button>
              ) : (
                <div className="edit-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    <FaTimes /> Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                  >
                    <FaCheck /> Save Changes
                  </button>
                </div>
              )}
            </div>
            
            {isEditing ? (
              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleInputChange} 
                    placeholder="Enter your full name"
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    placeholder="Enter your email"
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    placeholder="Enter your phone number"
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Address</label>
                  <div className="input-with-icon">
                    <FaMapMarkerAlt className="input-icon" />
                    <input 
                      type="text" 
                      name="address" 
                      value={formData.address} 
                      onChange={handleInputChange} 
                      placeholder="Enter your address"
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Bio</label>
                  <textarea 
                    name="bio" 
                    value={formData.bio} 
                    onChange={handleInputChange} 
                    placeholder="Tell us about yourself..."
                    rows="4"
                  ></textarea>
                </div>
              </form>
            ) : (
              <div className="profile-info-grid">
                <div className="info-item">
                  <FaUser className="info-icon" />
                  <div>
                    <h4>Full Name</h4>
                    <p>{formData.fullName}</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <FaEnvelope className="info-icon" />
                  <div>
                    <h4>Email</h4>
                    <p>{formData.email}</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <FaPhone className="info-icon" />
                  <div>
                    <h4>Phone</h4>
                    <p>{formData.phone}</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <FaMapMarkerAlt className="info-icon" />
                  <div>
                    <h4>Address</h4>
                    <p>{formData.address}</p>
                  </div>
                </div>
                
                {formData.bio && (
                  <div className="info-item full-width">
                    <div>
                      <h4>About Me</h4>
                      <p>{formData.bio}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="profile-section">
            <div className="section-header">
              <h2>My Orders</h2>
              <button 
                onClick={fetchOrders} 
                className="btn btn-sm btn-outline"
                disabled={orderLoading}
              >
                {orderLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your orders...</p>
              </div>
            ) : (
              <>
                {orders.length === 0 ? (
                  <div className="no-orders">
                    <FaBoxOpen className="empty-icon" />
                    <h3>No Orders Yet</h3>
                    <p>You haven't placed any orders yet.</p>
                    <button 
                      onClick={() => navigate('/products')} 
                      className="btn btn-primary"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map(order => (
                      <div key={order.id} className="order-card">
                        <div className="order-header">
                          <div className="order-status-badge">
                            {getStatusIcon(order.status)}
                            <span className={`status-text ${order.status.toLowerCase()}`}>
                              {order.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </span>
                          </div>
                          <div className="order-meta">
                            <span className="order-id">Order #{order.id}</span>
                            <span className="order-date">{formatDate(order.created_at || order.createdAt)}</span>
                            <span className="order-total">Total: ${order.total_amount?.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="order-items-preview">
                          {(order.items || []).slice(0, 3).map((item, index) => {
                            const itemPrice = parseFloat(item.price_per_unit || item.price || 0);
                            const itemQuantity = parseInt(item.quantity || 1, 10);
                            const itemTotal = (itemPrice * itemQuantity).toFixed(2);
                            
                            return (
                              <div key={`${item.id || index}`} className="order-item-preview">
                                <img 
                                  src={getProductImage(item.image || item.image_url)} 
                                  alt={item.name || 'Product'} 
                                  className="item-image"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `${process.env.PUBLIC_URL}/images/placeholder-product.jpg`;
                                  }}
                                />
                                <div className="item-details">
                                  <h4 className="item-name">{item.name || 'Product'}</h4>
                                  <p className="item-quantity">Qty: {itemQuantity}</p>
                                </div>
                                <div className="item-price">
                                  ${itemTotal}
                                </div>
                              </div>
                            );
                          })}
                          {order.items && order.items.length > 3 && (
                            <div className="more-items">
                              +{order.items.length - 3} more item{order.items.length > 4 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        
                        <div className="order-footer">
                          <div className="order-shipping">
                            <FaTruck className="icon" />
                            <span>Shipped to: {order.shipping_address}</span>
                          </div>
                          <div className="order-actions">
                            <button 
                              className="btn btn-primary"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              <FaShoppingBag /> View Details
                            </button>
                            {order.status === 'pending' && (
                              <button 
                                className="btn btn-danger"
                                onClick={() => handleCancelOrder(order.id)}
                              >
                                <FaTimes /> Cancel Order
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

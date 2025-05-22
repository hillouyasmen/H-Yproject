import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiEdit2, FiHeart, FiShoppingBag, FiMapPin, FiPhone, FiMail, FiUser } from "react-icons/fi";
import "../styles/UserPage.css";

const bodyTypeInfo = {
  hourglass: {
    name: "Hourglass",
    description: "Balanced body shape with defined waist. Shoulders and hips are about the same width, with a narrower waist. This shape is characterized by feminine proportions."
  },
  pear: {
    name: "Pear",
    description: "Hips are wider than shoulders, with a defined waist. This body shape features soft, feminine lines with emphasis on the lower body."
  },
  apple: {
    name: "Apple",
    description: "Upper body is wider with less defined waist. This shape features smooth lines and a rounded midsection."
  },
  rectangle: {
    name: "Rectangle",
    description: "Straight body shape with little difference between shoulders, waist, and hips measurements. Features a long, lean line that works well with many styles."
  }
};

export default function UserPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      navigate("/login");
      return;
    }

    setUser(storedUser);
    
    const fetchData = async () => {
      try {
        const [ordersRes, favoritesRes] = await Promise.all([
          fetch('/api/user/orders'),
          fetch('/api/user/favorites')
        ]);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData);
        }

        if (favoritesRes.ok) {
          const favoritesData = await favoritesRes.json();
          setFavorites(favoritesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await fetch('/api/user/update-photo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const data = await response.json();
      const updatedUser = { ...user, profileImage: data.photoUrl };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error uploading photo:', error);
      setUploadError('Error uploading photo');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getOrderStatus = (status) => {
    const statusMap = {
      pending: 'Pending',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return statusMap[status] || status;
  };

  const getBodyTypeImage = (bodyType) => {
    const type = bodyType.toLowerCase();
    return `/images/body-types/${type}.png`;
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="user-page">
      <div className="user-header">
        <div className="profile-section">
          <div className="avatar-section">
            <img
              src={user.profileImage || "/images/default-avatar.png"}
              alt="Profile"
              className="user-avatar"
            />
            <div className="avatar-upload">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: "none" }}
                id="photo-upload"
                disabled={uploading}
              />
              <label htmlFor="photo-upload" className="edit-photo-btn">
                <FiEdit2 />
              </label>
            </div>
            {uploadError && <p className="error-message">{uploadError}</p>}
          </div>

          <div className="user-info">
            <h2>{user.name}</h2>
            <p><FiMail /> {user.email}</p>
            {user.phone && <p><FiPhone /> {user.phone}</p>}
            {user.address && <p><FiMapPin /> {user.address}</p>}
          </div>
        </div>

        <div className="tabs">
          <motion.button
            className={`tab ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiUser /> Profile
          </motion.button>
          <motion.button
            className={`tab ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiShoppingBag /> Orders
          </motion.button>
          <motion.button
            className={`tab ${activeTab === "favorites" ? "active" : ""}`}
            onClick={() => setActiveTab("favorites")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiHeart /> Favorites
          </motion.button>
        </div>
      </div>

      <div className="tab-content">
        {activeTab === "profile" && (
          <motion.div
            className="profile-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="profile-info">
              <h3>Personal Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Name:</span>
                  <span className="value">{user.name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="info-item">
                    <span className="label">Phone:</span>
                    <span className="value">{user.phone}</span>
                  </div>
                )}
                {user.address && (
                  <div className="info-item">
                    <span className="label">Address:</span>
                    <span className="value">{user.address}</span>
                  </div>
                )}
              </div>
            </div>

            {user.body_type && (
              <div className="body-type-section">
                <h3>Your Body Type</h3>
                <div className="body-type-container">
                  <img
                    src={getBodyTypeImage(user.body_type)}
                    alt={bodyTypeInfo[user.body_type.toLowerCase()].name}
                    className="body-type-image"
                  />
                  <div className="body-type-info">
                    <h4>{bodyTypeInfo[user.body_type.toLowerCase()].name}</h4>
                    <p className="body-type-description">
                      {bodyTypeInfo[user.body_type.toLowerCase()].description}
                    </p>
                    <Link to="/setup-profile" className="edit-btn">
                      Update Body Type
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "orders" && (
          <motion.div
            className="orders-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {orders.length > 0 ? (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <h4>Order #{order._id}</h4>
                      <span className={`status ${order.status}`}>
                        {getOrderStatus(order.status)}
                      </span>
                    </div>
                    <div className="order-details">
                      <p>Date: {formatDate(order.date)}</p>
                      <p>Total: {formatPrice(order.total)}</p>
                    </div>
                    <button className="view-details-btn">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No orders yet</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "favorites" && (
          <motion.div
            className="favorites-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {favorites.length > 0 ? (
              <div className="favorites-grid">
                {favorites.map((item) => (
                  <div key={item._id} className="favorite-card">
                    <img src={item.image} alt={item.name} />
                    <h4>{item.name}</h4>
                    <p>{formatPrice(item.price)}</p>
                    <button className="remove-btn">
                      Remove from Favorites
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No favorite items yet</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

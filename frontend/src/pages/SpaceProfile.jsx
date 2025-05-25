import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiHeart, FiShoppingBag, FiSettings } from 'react-icons/fi';
import '../styles/SpaceProfile.css';

export default function SpaceProfile() {
  const [activeTab, setActiveTab] = useState('profile');
  const user = {
    name: 'שרה כהן',
    email: 'sarah@example.com',
    orders: [
      { id: 1, name: 'שמלת ערב', price: 299.99, date: '2025-05-20' },
      { id: 2, name: 'חולצת משי', price: 199.99, date: '2025-05-15' }
    ],
    favorites: [
      { id: 1, name: 'שמלת ערב מעוצבת', price: 599.99 },
      { id: 2, name: 'חולצת משי יוקרתית', price: 299.99 }
    ]
  };

  return (
    <div className="space-profile">
      <div className="profile-header">
        <motion.div 
          className="avatar"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiUser className="avatar-icon" />
        </motion.div>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
      </div>

      <nav className="profile-nav">
        <motion.button 
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          whileHover={{ scale: 1.05 }}
        >
          <FiUser /> פרופיל
        </motion.button>
        <motion.button 
          className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
          whileHover={{ scale: 1.05 }}
        >
          <FiShoppingBag /> הזמנות
        </motion.button>
        <motion.button 
          className={`nav-item ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
          whileHover={{ scale: 1.05 }}
        >
          <FiHeart /> מועדפים
        </motion.button>
        <motion.button 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          whileHover={{ scale: 1.05 }}
        >
          <FiSettings /> הגדרות
        </motion.button>
      </nav>

      <div className="profile-content">
        {activeTab === 'profile' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="content-section"
          >
            <h2>הפרטים שלי</h2>
            <div className="profile-details">
              <div className="detail-item">
                <span className="label">שם:</span>
                <span className="value">{user.name}</span>
              </div>
              <div className="detail-item">
                <span className="label">דוא"ל:</span>
                <span className="value">{user.email}</span>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="content-section"
          >
            <h2>ההזמנות שלי</h2>
            <div className="orders-list">
              {user.orders.map(order => (
                <motion.div 
                  key={order.id}
                  className="order-item"
                  whileHover={{ scale: 1.02 }}
                >
                  <h3>{order.name}</h3>
                  <p className="price">₪{order.price}</p>
                  <p className="date">{order.date}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'favorites' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="content-section"
          >
            <h2>המועדפים שלי</h2>
            <div className="favorites-list">
              {user.favorites.map(item => (
                <motion.div 
                  key={item.id}
                  className="favorite-item"
                  whileHover={{ scale: 1.02 }}
                >
                  <h3>{item.name}</h3>
                  <p className="price">₪{item.price}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="content-section"
          >
            <h2>הגדרות</h2>
            <form className="settings-form">
              <div className="form-group">
                <label>שם מלא</label>
                <input type="text" defaultValue={user.name} />
              </div>
              <div className="form-group">
                <label>דוא"ל</label>
                <input type="email" defaultValue={user.email} />
              </div>
              <motion.button 
                type="submit"
                className="save-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                שמור שינויים
              </motion.button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
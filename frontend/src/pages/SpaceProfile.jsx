import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiShoppingBag, FiHeart, FiSettings } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/SpaceProfile.css';

export default function SpaceProfile() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState({
    name: 'שרה כהן',
    email: 'sarah@example.com',
    orders: [
      { id: 1, date: '2025-05-20', status: 'delivered', total: 299.99 },
      { id: 2, date: '2025-05-15', status: 'processing', total: 199.99 }
    ],
    favorites: [
      { id: 1, name: 'שמלת ערב מעוצבת', price: 599.99 },
      { id: 2, name: 'חולצת משי יוקרתית', price: 299.99 }
    ]
  });

  useEffect(() => {
    // Simulate loading user data
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center space-x-6 rtl:space-x-reverse"
          >
            <div className="w-24 h-24 rounded-full bg-white p-1">
              <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                <FiUser className="w-12 h-12 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <p className="text-purple-100">{user.email}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8 rtl:space-x-reverse">
            {[
              { id: 'profile', icon: FiUser, label: 'פרופיל' },
              { id: 'orders', icon: FiShoppingBag, label: 'הזמנות' },
              { id: 'favorites', icon: FiHeart, label: 'מועדפים' },
              { id: 'settings', icon: FiSettings, label: 'הגדרות' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 rtl:space-x-reverse py-4 px-1 border-b-2 transition-colors ${activeTab === tab.id ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-purple-600 hover:border-purple-300'}`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800">ההזמנות שלי</h2>
              <div className="divide-y divide-gray-200">
                {user.orders.map((order) => (
                  <div key={order.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">הזמנה #{order.id}</p>
                      <p className="text-sm text-gray-500">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-purple-600">${order.total}</p>
                      <p className={`text-sm ${order.status === 'delivered' ? 'text-green-500' : 'text-orange-500'}`}>
                        {order.status === 'delivered' ? 'נמסר' : 'בעיבוד'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800">המועדפים שלי</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {user.favorites.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-purple-600 font-medium">${item.price}</p>
                    </div>
                    <button className="text-pink-500 hover:text-pink-600">
                      <FiHeart className="w-6 h-6" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-gray-800">הפרופיל שלי</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">שם מלא</label>
                  <input
                    type="text"
                    defaultValue={user.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">אימייל</label>
                  <input
                    type="email"
                    defaultValue={user.email}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  שמור שינויים
                </button>
              </form>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-gray-800">הגדרות</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">התראות במייל</p>
                    <p className="text-sm text-gray-500">קבל עדכונים על הזמנות ומבצעים</p>
                  </div>
                  <button className="w-12 h-6 rounded-full bg-purple-600 flex items-center p-1">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">פרטיות</p>
                    <p className="text-sm text-gray-500">הגדרות פרטיות החשבון</p>
                  </div>
                  <button className="text-purple-600 hover:text-purple-700 font-medium">
                    ערוך
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
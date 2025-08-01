// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaBox, FaUser, FaShoppingBag, FaSignInAlt, FaSignOutAlt, FaShoppingCart } from 'react-icons/fa';
import { GiDress } from 'react-icons/gi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CategoriesDropdown from './CategoriesDropdown';
import Cart from './Cart';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartItems, isCartOpen, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartItemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  
  const [showCart, setShowCart] = useState(false);
  
  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
    setShowCart(true);
  };
  
  const handleCartClose = () => {
    setIsCartOpen(false);
    setShowCart(false);
  };
  
  return (
    <header className="navbar-header">
      <nav className="main-nav">
        <div className="container">

          {/* Logo */}
          <div className="logo">
            <GiDress className="logo-icon" />
            <div className="logo-text">
              <span className="logo-main">H&Y Moda</span>
              <span className="logo-sub">Luxury Body Shaping</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="nav-links">
            <Link to="/" className="nav-link">
              <FaHome className="nav-icon" />
              <span>Home</span>
            </Link>

            <CategoriesDropdown />
            
            <Link to="/bodyshape" className="nav-link">
              <FaBox className="nav-icon" />
              <span>Body Shape</span>
            </Link>

            {isAuthenticated && user?.role !== 'admin' && (
              <div 
                className="nav-link cart-link" 
                onClick={toggleCart}
              >
                <div className="cart-icon-container">
                  <FaShoppingBag className="nav-icon" />
                  {cartItemCount > 0 && (
                    <span className="cart-badge">{cartItemCount}</span>
                  )}
                </div>
                <span>Cart</span>
              </div>
            )}

            {isAuthenticated ? (
              <>
                <Link to="/profile" className="nav-link">
                  <FaUser className="nav-icon" />
                  <span>Profile</span>
                </Link>
                
                {user?.role === 'admin' && (
                  <Link to="/admin" className="nav-link">
                    <FaUser className="nav-icon" />
                    <span>Admin</span>
                  </Link>
                )}
                
                <button onClick={handleLogout} className="nav-link">
                  <FaSignOutAlt className="nav-icon" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="nav-link">
                <FaSignInAlt className="nav-icon" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </nav>
      {showCart && <Cart onClose={handleCartClose} />}
    </header>
  );
};

export default Navbar;

// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaBox, FaUser, FaShoppingBag, FaSignInAlt, FaSignOutAlt, FaShoppingCart, FaTachometerAlt, FaPlusCircle, FaList } from 'react-icons/fa';
import { GiDress } from 'react-icons/gi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Cart from './Cart';
import CategoriesDropdown from './CategoriesDropdown';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const { isCartOpen, toggleCart, closeCart } = useCart();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled(offset > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <nav className="navbar">
        <div className="nav-container">

          {/* Logo */}
          <div className="nav-logo">
            <Link to="/" className="logo" onClick={closeCart}>
              <GiDress className="logo-icon" />
              <span>H&Y Moda</span>
            </Link>
          </div>

          <button 
            className={`hamburger ${isMenuOpen ? 'open' : ''}`} 
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/" className="nav-link" onClick={closeCart}>
              <FaHome className="nav-icon" />
              <span>Home</span>
            </Link>

            <CategoriesDropdown />

            <Link to="/bodyshape" className="nav-link" onClick={closeCart}>
              <FaBox className="nav-icon" />
              <span>Body Shape</span>
            </Link>

            {isAuthenticated && user?.role !== 'admin' && (
              <button onClick={toggleCart} className="nav-link cart-button">
                <FaShoppingCart className="nav-icon" />
                <span>Cart</span>
              </button>
            )}

            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <>
                    <Link to="/admin/dashboard" className="nav-link admin-link" onClick={closeCart}>
                      <FaTachometerAlt className="nav-icon" />
                      <span>Dashboard</span>
                    </Link>
                    <div className="dropdown">
                      <button className="dropdown-toggle nav-link admin-link">
                        <FaBox className="nav-icon" />
                        <span>Products</span>
                      </button>
                      <div className="dropdown-menu">
                        <Link to="/admin/products" className="dropdown-item" onClick={closeCart}>
                          <FaList className="nav-icon" />
                          <span>All Products</span>
                        </Link>
                        <Link to="/admin/products/new" className="dropdown-item" onClick={closeCart}>
                          <FaPlusCircle className="nav-icon" />
                          <span>Add New</span>
                        </Link>
                      </div>
                    </div>
                  </>
                )}
                <Link to="/profile" className="nav-link" onClick={closeCart}>
                  <FaUser className="nav-icon" />
                  <span>Profile</span>
                </Link>
                <button onClick={handleLogout} className="nav-link">
                  <FaSignOutAlt className="nav-icon" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="nav-link" onClick={closeCart}>
                <FaSignInAlt className="nav-icon" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </nav>
      {isCartOpen && <Cart />}
    </header>
  );
};

export default Navbar;

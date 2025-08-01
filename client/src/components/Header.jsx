import React from 'react';
import { FaHome, FaBox, FaShoppingCart, FaSignOutAlt } from 'react-icons/fa';

const Header = ({ username, onLogout, activeSection, setActiveSection }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo">
          <h1>H&Y Moda</h1>
          <p>Premium Body Shaping Products</p>
        </div>
        
        <nav className="main-nav">
          <button 
            className={`nav-button ${activeSection === 'home' ? 'active' : ''}`}
            onClick={() => setActiveSection('home')}
          >
            <FaHome /> Home
          </button>
          <button 
            className={`nav-button ${activeSection === 'products' ? 'active' : ''}`}
            onClick={() => setActiveSection('products')}
          >
            <FaBox /> Products
          </button>
          <button 
            className={`nav-button ${activeSection === 'items' ? 'active' : ''}`}
            onClick={() => setActiveSection('items')}
          >
            <FaBox /> Manage Products
          </button>
          <button 
            className={`nav-button ${activeSection === 'cart' ? 'active' : ''}`}
            onClick={() => setActiveSection('cart')}
          >
            <FaShoppingCart /> Cart
          </button>
        </nav>
        
        <div className="user-info">
          <span>Welcome, {username}</span>
          <button onClick={onLogout} className="logout-button">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

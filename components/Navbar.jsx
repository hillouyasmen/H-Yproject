import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiSearch, FiX, FiShoppingBag, FiHome, FiUser } from "react-icons/fi";
import "../styles/Navbar.css";

const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    // Add search functionality here
    console.log("Searching for:", searchQuery);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => document.getElementById("search-input").focus(), 100);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="logo-container">
          <motion.h1
            className="main-logo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            H&Y MODA
          </motion.h1>
        </Link>

        <div className="nav-links">
          <Link to="/" className="home-link">
            <FiHome size={18} /> HOME
          </Link>
          <Link to="/shop">SHOP</Link>
          <Link to="/collections">COLLECTIONS</Link>

          <Link to="/about">ABOUT</Link>
          <Link to="/contact">CONTACT</Link>
        </div>
      </div>

      <div className="nav-right">
        <Link to="/admin" className="nav-button login-button">
          <FiUser size={18} /> LOGIN
        </Link>
        <Link to="/cart" className="nav-button cart-icon">
          <FiShoppingBag size={20} />
        </Link>
        <motion.button
          className="search-toggle"
          onClick={toggleSearch}
          initial={false}
          animate={{ opacity: isSearchOpen ? 0 : 1 }}
        >
          <FiSearch size={20} />
        </motion.button>

        <motion.form
          className="search-form"
          initial={{ opacity: 0, x: "100%" }}
          animate={{
            opacity: isSearchOpen ? 1 : 0,
            x: isSearchOpen ? "0%" : "100%",
          }}
          transition={{ type: "tween", duration: 0.3 }}
          onSubmit={handleSearch}
        >
          <input
            id="search-input"
            type="text"
            placeholder="SEARCH"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="button" className="close-search" onClick={toggleSearch}>
            <FiX size={24} />
          </button>
        </motion.form>
      </div>
    </nav>
  );
};

export default Navbar;

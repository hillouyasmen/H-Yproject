import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiSearch, FiX, FiHome, FiUser, FiHeart } from "react-icons/fi";
import { GiDress } from "react-icons/gi";
import CartIcon from './CartIcon';
import "../styles/Navbar.css";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isBodyShapeOpen, setIsBodyShapeOpen] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // Add search functionality here
    console.log("Searching for:", searchQuery);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => document.getElementById("search-input")?.focus(), 100);
    }
  };

  const toggleBodyShape = () => {
    setIsBodyShapeOpen(!isBodyShapeOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    setUser(null);
    navigate("/");
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
          <Link to="/" className="nav-link">
            <FiHome size={18} /> בית
          </Link>
          <Link to="/categories" className="nav-link">
            <GiDress size={18} /> קטגוריות
          </Link>
          <Link to="/body-shapes" className="nav-link">
            <GiDress size={18} /> מבנה גוף
          </Link>
          <Link to="/favorites" className="nav-link">
            <FiHeart size={18} /> מועדפים
          </Link>
          <Link to="/contact" className="nav-link">
            צור קשר
          </Link>
        </div>
      </div>

      <div className="nav-right">
        {user ? (
          <>
            {user.role === "admin" && (
              <Link to="/admin-login" className="nav-button admin-button">
                <FiUser size={18} /> ניהול
              </Link>
            )}
            <Link to="/user" className="nav-button profile-button">
              <FiUser size={18} /> {user.username}
            </Link>
            <button onClick={handleLogout} className="nav-button logout-button">
              התנתקות
            </button>
          </>
        ) : (
          <>
            <Link to="/signup" className="nav-button signup-button">
              הרשמה
            </Link>
            <Link to="/login" className="nav-button login-button">
              <FiUser size={18} /> התחברות
            </Link>
          </>
        )}

        <CartIcon />

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
            placeholder="חיפוש..."
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
}

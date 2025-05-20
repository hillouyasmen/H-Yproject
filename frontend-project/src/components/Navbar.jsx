import React from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css"; // تأكد من وجود هذا الملف

export default function Navbar({ isLoggedIn, onLogout }) {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    console.error("❌ Failed to parse user from localStorage:", error);
  }

  return (
    <nav className="navbar">
      <h2 className="logo">H&Y MODA</h2>
      <ul className="nav-links">
        <li><Link to="/">HOME</Link></li>
        <li><Link to="/shop">SHOP</Link></li>
        <li><Link to="/collections">COLLECTIONS</Link></li>
        <li><Link to="/about">ABOUT</Link></li>
        <li><Link to="/contact">CONTACT</Link></li>

        {!isLoggedIn ? (
          <>
            <li><Link to="/login">LOGIN</Link></li>
            <li><Link to="/signup">REGISTER</Link></li>
          </>
        ) : (
          <>
            <li><span>👤 {user?.username}</span></li>
            <li><button onClick={onLogout}>LOGOUT</button></li>
          </>
        )}
      </ul>
    </nav>
  );
}

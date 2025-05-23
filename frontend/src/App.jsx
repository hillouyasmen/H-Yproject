import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { CartProvider } from "./context/CartContext";

import Register from "./pages/Register";
import Login from "./pages/Login";
import SpaceProfile from "./pages/SpaceProfile";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ResetPassword from "./pages/ResetPassword";
import Navbar from "./components/Navbar";
import About from "./pages/About";
import Contact from "./pages/Contact";
import BodySetup from "./pages/BodySetup";
import Categories from "./pages/Categories";
import CategoryView from "./pages/CategoryView";

import AdminPanel from "./pages/AdminPanel";
import BodyShapes from "./pages/BodyShapes";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Favorites from "./pages/Favorites";

function App() {
  const [user, setUser] = useState(() => {
    // Initialize from localStorage to avoid hydration mismatch
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    // Keep user state in sync with localStorage changes (optional)
    const handleStorage = () => {
      const savedUser = localStorage.getItem("user");
      setUser(savedUser ? JSON.parse(savedUser) : null);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <Router>
      <CartProvider>
        <Navbar user={user} setUser={setUser} />
        <div style={{ paddingTop: "80px" }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />

            <Route path="/about" element={<About />} />
            <Route path="/body-shapes" element={<BodyShapes />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/products" element={<Products />} />
            <Route
              path="/profile"
              element={
                user ? (
                  <SpaceProfile />
                ) : (
                  <Navigate to="/login" state={{ from: "/profile" }} />
                )
              }
            />
            <Route path="/categories" element={<Categories />} />
            <Route path="/category/:id" element={<CategoryView />} />
            <Route path="/cart" element={<Cart />} />
            <Route
              path="/favorites"
              element={
                user ? (
                  <Favorites />
                ) : (
                  <Navigate to="/login" state={{ from: "/favorites" }} />
                )
              }
            />
            <Route
              path="/checkout"
              element={
                user ? (
                  <Checkout />
                ) : (
                  <Navigate to="/login" state={{ from: "/checkout" }} />
                )
              }
            />
            <Route
              path="/order-confirmation"
              element={user ? <OrderConfirmation /> : <Navigate to="/login" />}
            />

            {/* Auth Routes */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route
              path="/admin"
              element={
                user?.role === "admin" ? (
                  <AdminPanel />
                ) : (
                  <Navigate to="/login" state={{ from: "/admin" }} />
                )
              }
            />

            <Route
              path="/setup-profile"
              element={
                user ? (
                  <BodySetup />
                ) : (
                  <Navigate to="/login" state={{ from: "/setup-profile" }} />
                )
              }
            />
          </Routes>
        </div>
      </CartProvider>
    </Router>
  );
}

export default App;

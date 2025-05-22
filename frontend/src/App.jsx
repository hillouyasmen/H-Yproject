import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from './context/CartContext';

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import UserPage from "./pages/UserPage";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ResetPassword from "./pages/ResetPassword";
import Navbar from "./components/Navbar";
import About from "./pages/About";
import Contact from "./pages/Contact";
import BodySetup from "./pages/BodySetup";
import Categories from "./pages/Categories";
import CategoryView from "./pages/CategoryView";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import BodyShapes from "./pages/BodyShapes";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser) setUser(savedUser);
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
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/:id" element={<CategoryView />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={user ? <Checkout /> : <Navigate to="/login" state={{ from: "/checkout" }} />} />
          <Route path="/order-confirmation" element={user ? <OrderConfirmation /> : <Navigate to="/login" />} />

          {/* Auth Routes */}
          <Route path="/signup" element={<Signup />} />
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
            path="/user"
            element={
              user ? (
                <UserPage />
              ) : (
                <Navigate to="/login" state={{ from: "/user" }} />
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

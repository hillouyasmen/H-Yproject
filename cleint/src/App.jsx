// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import NotificationsHost from "./components/Notifications.jsx";

import Home from "./pages/Home.jsx";
import Store from "./pages/Store.jsx";
import Bodyshape from "./pages/Bodyshape.jsx";
import Categories from "./pages/Categories.jsx";
import About from "./pages/About.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import Cart from "./pages/Cart.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Checkout from "./pages/Checkout.jsx";
import Invoice from "./pages/Invoice.jsx";
import Product from "./pages/Product.jsx";
import Contact from "./pages/Contact.jsx";
import ClubPage from "./pages/Club.jsx";
import ThankYou from "./pages/ThankYou.jsx";
import Account from "./pages/Account.jsx";

import EventsClient from "./components/EventsClient.jsx";

export default function App() {
  return (
    <>
      <NotificationsHost />
      <Header />

      <main className="container" style={{ paddingTop: 20 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/store" element={<Store />} />
          <Route path="/bodyshape" element={<Bodyshape />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/club" element={<ClubPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset" element={<ResetPassword />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/invoice/:id" element={<Invoice />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/account" element={<Account />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
      <EventsClient />
    </>
  );
}

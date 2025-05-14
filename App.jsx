import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Navbar from "./components/Navbar.jsx";

import "./App.css";
import BodyTypeShop from "./pages/BodyTypeShop.jsx";
import Shop from "./pages/Shop.jsx";
import Signup from "./pages/Signup.jsx";
function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/shop" element={<Shop />} />

            <Route path="/shop/:bodyType" element={<BodyTypeShop />} />
          </Routes>
        </main>
        <footer>
          <p>&copy; 2025 H&Y Moda. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;

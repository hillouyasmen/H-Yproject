import React from "react";
import ReactDOM from "react-dom/client";
import { CartProvider } from './context/CartContext';
import App from "./App";
import "./styles/global.css";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>
);

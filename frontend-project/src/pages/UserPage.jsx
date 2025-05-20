import React from "react";
import "../styles/dashboard.css";

export default function UserPage() {
  return (
    <div className="dashboard user-dashboard">
      <h2>Welcome, User</h2>

      <section className="panel">
        <h3>Filter Panel</h3>
        <div className="filter-panel">
          <label>Category:</label>
          <select>
            <option>All</option>
            <option>Dresses</option>
            <option>Tops</option>
          </select>
        </div>
      </section>

      <section className="panel">
        <h3>Collections</h3>
        <ul className="collections">
          <li>Summer 2025</li>
          <li>Elegant Wear</li>
          <li>Body Shape Picks</li>
        </ul>
      </section>

      <section className="panel">
        <h3>Cart</h3>
        <ul className="cart">
          <li>Dress - $120</li>
          <li>Top - $60</li>
        </ul>
      </section>
    </div>
  );
}

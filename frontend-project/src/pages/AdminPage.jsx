import React from "react";
import "../styles/dashboard.css";

export default function AdminPage() {
  return (
    <div className="dashboard admin-dashboard">
      <h2>Admin Dashboard</h2>

      <section className="panel">
        <h3>Add Product</h3>
        <form className="form-grid">
          <input placeholder="Product Name" />
          <input placeholder="Price" type="number" />
          <select>
            <option>Dress</option>
            <option>Top</option>
          </select>
          <button>Add</button>
        </form>
      </section>

      <section className="panel">
        <h3>Reports</h3>
        <p>Sales Today: $320</p>
        <p>Products in Stock: 87</p>
      </section>

      <section className="panel">
        <h3>Add Sale</h3>
        <form className="form-grid">
          <input placeholder="Product ID" />
          <input placeholder="Quantity Sold" type="number" />
          <button>Record Sale</button>
        </form>
      </section>
    </div>
  );
}

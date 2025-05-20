import React from "react";
import "../styles/Collections.css";

const Collections = () => {
  return (
    <div className="collections-container">
      <h1>Our Collections</h1>
      <div className="collections-grid">
        <div className="collection-card">
          <img src="/images/placeholder.jpg" alt="Summer Collection" />
          <h2>Summer 2025</h2>
          <p>Explore our latest summer styles</p>
        </div>
        <div className="collection-card">
          <img src="/images/placeholder.jpg" alt="Winter Collection" />
          <h2>Winter 2024/25</h2>
          <p>Stay warm with our winter collection</p>
        </div>
        <div className="collection-card">
          <img src="/images/placeholder.jpg" alt="Spring Collection" />
          <h2>Spring 2025</h2>
          <p>Fresh styles for the new season</p>
        </div>
        <div className="collection-card">
          <img src="/images/placeholder.jpg" alt="Special Occasions" />
          <h2>Special Occasions</h2>
          <p>Perfect outfits for your special moments</p>
        </div>
      </div>
    </div>
  );
};

export default Collections;

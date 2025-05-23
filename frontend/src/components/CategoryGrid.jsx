import React from 'react';
import { Link } from 'react-router-dom';
import { FiGrid } from 'react-icons/fi';
import '../styles/CategoryGrid.css';

const CategoryGrid = ({ categories }) => {
  return (
    <div className="category-section">
      <div className="category-grid">
        {categories.map((category) => (
          <Link 
            to={`/category/${category.id}`} 
            className="category-item" 
            key={category.id}
          >
            <div className="category-image-container">
              <img 
                src={category.imageUrl} 
                alt={category.title} 
                className="category-image"
              />
            </div>
            <h3 className="category-title">{category.title}</h3>
          </Link>
        ))}
      </div>
      <button className="view-toggle">
        <FiGrid />
      </button>
    </div>
  );
};

export default CategoryGrid;

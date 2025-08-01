import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../utils/api';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

// Default categories in case the API fails
const getDefaultCategories = () => [
  { id: 1, name: 'Dresses' },
  { id: 2, name: 'Tops' },
  { id: 3, name: 'Bottoms' },
  { id: 4, name: 'Accessories' }
];

const CategoriesDropdown = () => {
  const [categories, setCategories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories...');
        const response = await fetchApi('/categories');
        console.log('Categories response:', response);
        
        if (response && response.success !== undefined) {
          if (response.success && Array.isArray(response.data)) {
            setCategories(response.data);
            setError(null);
          } else {
            // If no categories found, use default categories
            console.warn('No categories found, using defaults');
            setCategories(getDefaultCategories());
          }
        } else {
          // If response format is unexpected, use default categories
          console.warn('Unexpected response format, using default categories');
          setCategories(getDefaultCategories());
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        console.error('Error loading categories:', err);
        setError('Failed to load categories');
        // Use default categories on error
        setCategories(getDefaultCategories());
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  if (isLoading) return null; // Or a loading spinner
  if (error) return null; // Or an error message

  return (
    <div className="categories-dropdown">
      <button 
        className="dropdown-toggle nav-link" 
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>Categories</span>
        {isOpen ? <FaChevronUp className="dropdown-icon" /> : <FaChevronDown className="dropdown-icon" />}
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.id}`}
              className="dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesDropdown;

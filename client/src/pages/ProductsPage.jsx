import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { getProductImage } from '../utils/imageUtils';
import '../styles/products.css';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:5001/api';

  const fetchProducts = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {

        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'נכשל בטעינת המוצרים');
      }

      const result = await response.json();
      // Handle the API response format: { success: boolean, data: array }
      const productsList = Array.isArray(result.data) ? result.data : [];
      setProducts(productsList);
      
      if (productsList.length === 0) {
        showNotification('לא נמצאו מוצרים להצגה', 'info');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      const errorMessage = err.message || 'אירעה שגיאה בטעינת המוצרים';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <div className="products-container">
        <div className="loading-spinner">טוען מוצרים...</div>
      </div>
    );
  }


  return (
    <div className="products-page">
      <h1 className="page-title">המוצרים שלנו</h1>
      
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')} className="close-btn">×</button>
        </div>
      )}

      {products.length === 0 ? (
        <div className="no-products">לא נמצאו מוצרים להצגה</div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id || product.item_id} className="product-card">
              <div className="product-image">
                <img 
                  src={getProductImage(product.image_url)} 
                  alt={product.name} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `${process.env.PUBLIC_URL}/images/placeholder-product.jpg`;
                  }}
                />
              </div>
              <div className="product-details">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">
                  {product.description || 'אין תיאור זמין'}
                </p>
                <div className="product-price">
                ₪{!isNaN(Number(product.price)) ? Number(product.price).toFixed(2) : '0.00'}

                </div>
              </div>
              <button 
                className="add-to-cart-btn"
                onClick={() => {
                  // Add to cart functionality can be implemented here
                  showNotification(`הוספת ${product.name} לסל הקניות`, 'success');
                }}
              >
                הוסף לסל
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
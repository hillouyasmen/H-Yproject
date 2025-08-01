import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { getProductImage } from '../utils/imageUtils';
import { fetchApi } from '../utils/api';
import { FaStar, FaRegStar, FaStarHalfAlt, FaShoppingCart, FaArrowLeft } from 'react-icons/fa';
import '../styles/CategoryPage.css';

const CategoryPage = () => {
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryData = async () => {
      console.log(`Fetching data for category ID: ${id}`);
      try {
        setIsLoading(true);
        
        // 1. Fetch category details
        console.log('Fetching category details...');
        const categoryResponse = await fetchApi(`/categories/${id}`);
        console.log('Category response:', categoryResponse);
        
        if (categoryResponse && categoryResponse.success) {
          setCategory(categoryResponse.data);
          console.log('Category data set:', categoryResponse.data);
        } else {
          const errorMsg = categoryResponse?.error || 'Failed to load category details';
          console.error('Category API error:', errorMsg);
          throw new Error(errorMsg);
        }
        
        // 2. Fetch products in this category
        console.log('Fetching products for category...');
        const productsResponse = await fetchApi(`/products?category=${id}`);
        console.log('Products response:', productsResponse);
        
        if (productsResponse && productsResponse.success) {
          const productsData = Array.isArray(productsResponse.data) 
            ? productsResponse.data 
            : (productsResponse.data?.products || []);
          
          console.log(`Found ${productsData.length} products`);
          setProducts(productsData);
        } else {
          console.warn('No products found or error:', productsResponse?.error);
          setProducts([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error in fetchCategoryData:', {
          message: err.message,
          stack: err.stack,
          response: err.response
        });
        setError(`Failed to load category data: ${err.message}`);
      } finally {
        console.log('Finished loading category data');
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCategoryData();
    } else {
      console.error('No category ID provided');
      setError('No category ID specified');
      setIsLoading(false);
    }
  }, [id]);

  // Function to render star ratings
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="star filled" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="star half" />);
      } else {
        stars.push(<FaRegStar key={i} className="star" />);
      }
    }
    return stars;
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="category-page">
      <div className="category-header">
        <Link to="/" className="back-button">
          <FaArrowLeft /> Back to Home
        </Link>
        <h1>{category?.name || 'Category'}</h1>
        {category?.description && <p className="category-description">{category.description}</p>}
      </div>

      <div className="products-grid">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="product-card">
              <Link to={`/product/${product.id}`} className="product-link">
                <div className="product-image">
                  <img 
                    src={getProductImage(product.image)} 
                    alt={product.name}
                    className="product-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `${process.env.PUBLIC_URL}/images/placeholder-product.jpg`;
                    }}
                  />
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <div className="product-rating">
                    {renderStars(product.rating || 0)}
                    <span className="rating-count">({product.reviewCount || 0})</span>
                  </div>
                  ₪{!isNaN(Number(product.price)) ? Number(product.price).toFixed(2) : '0.00'}                </div>
              </Link>
              <button className="add-to-cart-btn">
                <FaShoppingCart /> Add to Cart
              </button>
            </div>
          ))
        ) : (
          <div className="no-products">
            <p>No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;

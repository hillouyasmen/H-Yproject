import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaShoppingCart, FaStar } from 'react-icons/fa';
import { fetchApi } from '../utils/api';
import { getProductImage } from '../utils/imageUtils';
import './BodyShapeProducts.css';

const BodyShapeProducts = ({ shapeId }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000]);

  // Map shape IDs to database values
  const shapeMapping = {
    'hourglass': 'Hourglass',
    'pear': 'Pear',
    'apple': 'Apple',
    'rectangle': 'Rectangle',
    'inverted-triangle': 'Inverted Triangle'
  };

  const openModal = (product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if (selectedProduct && selectedProduct.images) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === selectedProduct.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (selectedProduct && selectedProduct.images) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === 0 ? selectedProduct.images.length - 1 : prevIndex - 1
      );
    }
  };

  // Filter products by body shape and search term
  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      const matchesShape = product.bodyShape && 
        product.bodyShape.toLowerCase() === (shapeMapping[shapeId] || '').toLowerCase();
      
      const matchesSearch = searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const productPrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
      const inPriceRange = !isNaN(productPrice) && productPrice >= priceRange[0] && productPrice <= priceRange[1];
      
      return matchesShape && matchesSearch && inPriceRange;
    });
  }, [products, shapeId, searchTerm, priceRange]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching products...');
        const response = await fetchApi('/products');
        console.log('Products response:', response);
        
        if (!response || !response.success) {
          throw new Error(response?.error || 'Failed to fetch products');
        }
        
        // Handle both response formats: { data: [...] } and direct array
        const productsData = Array.isArray(response.data) 
          ? response.data 
          : (response.products || []);
        
        console.log(`Loaded ${productsData.length} products`);
        setProducts(productsData);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(`Failed to load products: ${err.message || 'Please try again.'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = cart.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        cart[existingItemIndex].quantity += 1;
      } else {
        // Ensure price is a number before adding to cart
        const productWithNumberPrice = {
          ...product,
          price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
          quantity: 1
        };
        cart.push(productWithNumberPrice);
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Show success message
      const message = document.createElement('div');
      message.className = 'cart-message';
      message.textContent = `${product.name} added to cart!`;
      document.body.appendChild(message);
      
      setTimeout(() => message.remove(), 2000);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="body-shape-products">
      {/* Search and Filter */}
      <div className="filters-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="price-filter">
          <label>Price Range: ${priceRange[0]} - ${priceRange[1]}</label>
          <input
            type="range"
            min="0"
            max="1000"
            step="10"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="range-slider"
          />
        </div>
      </div>

      {/* Results */}
      <div className="results-count">
        {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {filteredProducts.map((product) => (
          <div 
            key={product.id} 
            className="product-card"
            onClick={() => openModal(product)}
          >
            <div className="product-image">
              <img 
                src={getProductImage(product.image || product.imageUrl)} 
                alt={product.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `${process.env.PUBLIC_URL}/images/placeholder-product.jpg`;
                }}
              />
              <button 
                className="quick-add-btn"
                onClick={(e) => handleAddToCart(product, e)}
              >
                <FaShoppingCart /> Add to Cart
              </button>
            </div>
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="price">${typeof product.price === 'number' ? product.price.toFixed(2) : 'N/A'}</p>
              {product.rating && (
                <div className="rating">
                  {[...Array(5)].map((_, i) => (
                    <FaStar 
                      key={i} 
                      className={i < Math.round(product.rating) ? 'filled' : ''} 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Product Modal */}
      {isModalOpen && selectedProduct && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={closeModal}>
              <FaTimes />
            </button>
            
            <div className="modal-body">
              <div className="modal-image-container">
                <img 
                  src={getProductImage(selectedProduct.image || selectedProduct.imageUrl)} 
                  alt={selectedProduct.name}
                  className="modal-product-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `${process.env.PUBLIC_URL}/images/placeholder-product.jpg`;
                  }}
                />
                
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <>
                    <button className="nav-button prev" onClick={prevImage}>
                      <FaChevronLeft />
                    </button>
                    <button className="nav-button next" onClick={nextImage}>
                      <FaChevronRight />
                    </button>
                  </>
                )}
              </div>
              
              <div className="modal-product-details">
                <h2>{selectedProduct.name}</h2>
                <p className="price">${typeof selectedProduct.price === 'number' ? selectedProduct.price.toFixed(2) : 'N/A'}</p>
                
                {selectedProduct.description && (
                  <div className="description">
                    <h4>Description</h4>
                    <p>{selectedProduct.description}</p>
                  </div>
                )}
                
                <div className="product-meta">
                  {selectedProduct.category && (
                    <div className="meta-item">
                      <span className="meta-label">Category:</span>
                      <span>{selectedProduct.category}</span>
                    </div>
                  )}
                  
                  {selectedProduct.bodyShape && (
                    <div className="meta-item">
                      <span className="meta-label">Recommended for:</span>
                      <span>{selectedProduct.bodyShape} Shape</span>
                    </div>
                  )}
                  
                  <div className="meta-item">
                    <span className="meta-label">Availability:</span>
                    <span className={selectedProduct.stock > 0 ? 'in-stock' : 'out-of-stock'}>
                      {selectedProduct.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
                
                <button 
                  className="add-to-cart"
                  onClick={(e) => {
                    handleAddToCart(selectedProduct, e);
                    closeModal();
                  }}
                >
                  <FaShoppingCart /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BodyShapeProducts;

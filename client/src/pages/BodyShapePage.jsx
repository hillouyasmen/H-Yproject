import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { FaTimes, FaChevronLeft, FaChevronRight, FaShoppingCart, FaStar, FaArrowRight } from 'react-icons/fa';
import { fetchApi } from '../utils/api';
import { formatShapeName } from '../utils/formatUtils';
import { getProductImage } from '../utils/imageUtils';
import '../styles/BodyShapePage.css';
import '../styles/LuxuryStyles.css';

// Add Google Fonts
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600&family=Cormorant+Garamond:wght@300;400;500;600&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

// Product Modal Component
const ProductModal = ({ product, onClose, onNext, onPrev, currentIndex, totalProducts, onAddToCart }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  if (!product) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (product.images?.length || 1));
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + (product.images?.length || 1)) % (product.images?.length || 1));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="product-modal" onClick={e => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className="modal-content">
          <div className="modal-image-container">
            <img 
              src={getProductImage(product.images?.[currentImageIndex] || product.image)} 
              alt={product.name} 
              className="modal-product-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `${process.env.PUBLIC_URL}/images/placeholder-product.jpg`;
              }}
            />
            
            {product.images?.length > 1 && (
              <>
                <button className="nav-arrow left-arrow" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                  <FaChevronLeft />
                </button>
                <button className="nav-arrow right-arrow" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                  <FaChevronRight />
                </button>
              </>
            )}
            
            <div className="image-indicators">
              {product.images?.map((_, index) => (
                <span 
                  key={index} 
                  className={`indicator ${currentImageIndex === index ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                />
              ))}
            </div>
          </div>
          
          <div className="modal-details">
            <h2>{product.name}</h2>
            <div className="product-price">
              ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
            </div>
            
            <div className="product-rating">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className={i < (product.rating || 5) ? 'filled' : ''} />
              ))}
              <span>({product.reviewCount || 0} reviews)</span>
            </div>
            
            <p className="product-description">{product.description}</p>
            
            <div className="product-actions">
              <button 
                className="add-to-cart-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product);
                }}
              >
                <FaShoppingCart /> Add to Cart
              </button>
            </div>
            
            <div className="product-meta">
              <span>Category: {product.category || 'Fashion'}</span>
              <span>Body Shape: {formatShapeName(product.body_shape) || 'All'}</span>
            </div>
          </div>
        </div>
        
        <div className="modal-navigation">
          <button 
            className="nav-btn" 
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            disabled={currentIndex === 0}
          >
            <FaChevronLeft /> Previous
          </button>
          <span>{currentIndex + 1} / {totalProducts}</span>
          <button 
            className="nav-btn" 
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            disabled={currentIndex === totalProducts - 1}
          >
            Next <FaChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

const bodyShapes = [
  { 
    id: 'hourglass',
    name: 'Hourglass', 
    image: 'https://cdn.prod.website-files.com/5eca30fd2b50b671e2107b06/60f12a025285e1675eb6871b_Hourglass%20Body%20Shape%20Title%20Image-p-500.webp', 
    description: 'Balanced hips and shoulders, defined waist.' 
  },
  { 
    id: 'pear',
    name: 'Pear', 
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTU8Wloco8n-mQWenF0UI0I_CsG6BPd2A2kHQ&s', 
    description: 'Wider hips, smaller bust.' 
  },
  { 
    id: 'apple',
    name: 'Apple', 
    image: 'https://www.style-yourself-confident.com/images/applebodyshape500.jpg', 
    description: 'Rounder midsection, slimmer legs.' 
  },
  { 
    id: 'rectangle',
    name: 'Rectangle', 
    image: 'https://cdn.prod.website-files.com/5eca30fd2b50b671e2107b06/60ee8f387785b9eb58eb0ea8_Rectangle%20Body%20Shape%20Title%20Image.webp', 
    description: 'Balanced, minimal curves.' 
  }
];

const BodyShapePage = () => {
  const [searchParams] = useSearchParams();
  const [selectedShape, setSelectedShape] = useState(searchParams.get('shape') || null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch products when shape is selected
  useEffect(() => {
    if (selectedShape) {
      fetchProducts(selectedShape);
    }
  }, [selectedShape]);

  const fetchProducts = async (shape) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchApi(`/products?shape=${shape}`);
      
      if (response && response.success) {
        setProducts(Array.isArray(response.data) ? response.data : []);
      } else {
        throw new Error(response?.error || 'Failed to load products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (shapeId) => {
    setSelectedShape(shapeId);
    window.history.pushState({}, '', `?shape=${shapeId}`);
  };

  const handleBack = () => {
    setSelectedShape(null);
    setProducts([]);
  };

  const openProductModal = (index) => {
    setSelectedProductIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  const closeProductModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  const goToNextProduct = () => {
    if (selectedProductIndex < products.length - 1) {
      setSelectedProductIndex(prev => prev + 1);
    }
  };

  const goToPrevProduct = () => {
    if (selectedProductIndex > 0) {
      setSelectedProductIndex(prev => prev - 1);
    }
  };

  const handleAddToCart = (product) => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItem = cart.find(item => item.id === product.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          ...product,
          quantity: 1,
          price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0
        });
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Dispatch custom event to update cart count in navbar
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Show success message (you can replace this with a toast notification)
      alert(`${product.name} added to cart!`);
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add item to cart');
    }
  };

  const selectedProduct = products[selectedProductIndex];
  const selectedShapeData = bodyShapes.find(shape => shape.id === selectedShape) || {
    id: '',
    name: 'Selected Shape',
    image: '',
    description: ''
  };

  return (
    <div className="luxury-body-shape-page">
      {!selectedShape ? (
        <>
          <header className="luxury-page-header">
            <h1 className="luxury-page-title">Discover Your Perfect Style</h1>
            <p className="luxury-page-subtitle">
              Select your body shape to explore curated fashion recommendations that highlight your best features.
              Our expert selections are designed to flatter your unique silhouette.
            </p>
          </header>
          
          <div className="luxury-shapes-grid">
            {bodyShapes.map((shape) => (
              <article 
                key={shape.id}
                className="luxury-shape-card"
                onClick={() => handleSelect(shape.id)}
              >
                <div className="luxury-shape-image-container">
                  <img 
                    src={getProductImage(shape.image)} 
                    alt={shape.name}
                    className="luxury-shape-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `${process.env.PUBLIC_URL}/images/placeholder-product.jpg`;
                    }}
                  />
                </div>
                <div className="luxury-shape-info">
                  <div>
                    <h3 className="luxury-shape-name">{shape.name}</h3>
                    <p className="luxury-shape-description">{shape.description}</p>
                  </div>
                  <button className="luxury-explore-btn">
                    Explore <FaArrowRight style={{ marginLeft: '8px' }} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="products-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
          <button 
            className="luxury-explore-btn"
            onClick={handleBack}
            style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center' }}
          >
            <FaChevronLeft style={{ marginRight: '8px' }} /> Back to Shapes
          </button>
          
          <h2 style={{ 
            fontFamily: 'var(--font-primary)', 
            fontSize: '2.2rem', 
            fontWeight: '400',
            marginBottom: '2rem',
            textAlign: 'center',
            position: 'relative',
            paddingBottom: '1rem'
          }}>
            Curated for {selectedShapeData?.name || 'Your Shape'}
            <span style={{
              position: 'absolute',
              bottom: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '2px',
              backgroundColor: 'var(--color-gold)'
            }}></span>
          </h2>
          
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem',
              fontFamily: 'var(--font-body)',
              fontSize: '1.1rem',
              color: '#777'
            }}>
              Loading curated selections...
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem',
              color: '#d32f2f',
              fontFamily: 'var(--font-body)'
            }}>
              {error}
            </div>
          ) : products.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem',
              fontStyle: 'italic',
              color: '#777',
              fontFamily: 'var(--font-body)'
            }}>
              No products found for this shape. Please check back soon for new arrivals.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '2rem',
              padding: '1rem 0'
            }}>
              {products.map((product) => (
                <article 
                  key={product.id}
                  style={{
                    background: 'white',
                    border: '1px solid rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onClick={() => openProductModal(products.indexOf(product))}
                >
                  <div style={{
                    position: 'relative',
                    paddingTop: '125%',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-ivory)'
                  }}>
                    <img 
                      src={getProductImage(product.image)} 
                      alt={product.name}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `${process.env.PUBLIC_URL}/images/placeholder-product.jpg`;
                      }}
                    />
                    {product.sale && (
                      <span style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'var(--color-gold)',
                        color: 'white',
                        padding: '0.3rem 0.8rem',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        letterSpacing: '1px'
                      }}>
                        SALE
                      </span>
                    )}
                  </div>
                  <div style={{
                    padding: '1.5rem',
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <h3 style={{
                        margin: '0 0 0.5rem',
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        fontFamily: 'var(--font-secondary)',
                        color: 'var(--color-charcoal)',
                        letterSpacing: '0.5px'
                      }}>
                        {product.name}
                      </h3>
                      <div style={{
                        color: '#888',
                        fontSize: '0.9rem',
                        marginBottom: '0.8rem',
                        fontFamily: 'var(--font-body)'
                      }}>
                        {product.category || 'Fashion'}
                      </div>
                      <div style={{
                        color: 'var(--color-charcoal)',
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        margin: '0.5rem 0',
                        fontFamily: 'var(--font-secondary)'
                      }}>
                        ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #f0f0f0'
                    }}>
                      <div style={{
                        color: '#FFC107',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            style={{
                              fontSize: '0.9rem',
                              marginRight: '2px',
                              color: i < (product.rating || 5) ? '#FFC107' : '#e0e0e0'
                            }} 
                          />
                        ))}
                      </div>
                      <button 
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#888',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontFamily: 'var(--font-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.3rem 0',
                          transition: 'color 0.3s ease'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Modal */}
      {isModalOpen && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={closeProductModal}
          onNext={goToNextProduct}
          onPrev={goToPrevProduct}
          currentIndex={selectedProductIndex}
          totalProducts={products.length}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
};

export default BodyShapePage;

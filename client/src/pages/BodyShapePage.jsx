import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaChevronLeft, FaArrowRight } from 'react-icons/fa';
import { fetchApi } from '../utils/api';
import { formatShapeName } from '../utils/formatUtils';
import { useCart } from '../context/CartContext';
import ProductModal from '../components/ProductModal'; // مودال المنتج المعدل هنا
import '../styles/BodyShapePage.css';
import '../styles/LuxuryStyles.css';

// أشكال الجسم
const bodyShapes = [
  { id: 'hourglass', name: 'Hourglass', image: 'F1.jpg', description: 'Balanced hips and shoulders, defined waist.' },
  { id: 'pear', name: 'Pear', image: 'F2.jpg', description: 'Wider hips, smaller bust.' },
  { id: 'apple', name: 'Apple', image: 'F3.jpg', description: 'Rounder midsection, slimmer legs.' },
  { id: 'rectangle', name: 'Rectangle', image: 'F4.jpg', description: 'Balanced, minimal curves.' }
];

// دالة لإرجاع مسار الصورة من public
const getProductImage = (img) =>
  img && typeof img === 'string'
    ? process.env.PUBLIC_URL + `/images/products/${img}`
    : process.env.PUBLIC_URL + '/images/placeholder-product.jpg';

const BodyShapePage = () => {
  const [searchParams] = useSearchParams();
  const [selectedShape, setSelectedShape] = useState(searchParams.get('shape') || null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { addToCart } = useCart();

  // جلب المنتجات عند اختيار شكل الجسم
  useEffect(() => {
    if (selectedShape) fetchProducts(selectedShape);
    // eslint-disable-next-line
  }, [selectedShape]);

  const fetchProducts = async (shape) => {
    setLoading(true); setError(null);
    try {
      const response = await fetchApi(`/products?shape=${shape}`);
      // فقط أول 4 منتجات
      setProducts(response?.success && Array.isArray(response.data) ? response.data.slice(0, 4) : []);
      if (!response?.success) throw new Error(response?.error || 'Failed to load products');
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally { setLoading(false); }
  };

  const handleSelect = (shapeId) => {
    setSelectedShape(shapeId);
    window.history.pushState({}, '', `?shape=${shapeId}`);
  };

  const handleBack = () => { setSelectedShape(null); setProducts([]); };
  const openProductModal = (product) => setSelectedProduct(product);
  const closeModal = () => setSelectedProduct(null);

  const handleAddToCart = async (product, quantity = 1) => {
    try { await addToCart(product, quantity); } catch { }
  };
  const handleOrderNow = async (orderData) => {
    try {
      const response = await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: orderData.name,
          customer_phone: orderData.phone,
          shipping_address: orderData.address,
          payment_method: "credit_card",
          credit_card_number: orderData.credit_card_number,
          credit_card_expiry: orderData.credit_card_expiry,
          credit_card_cvv: orderData.credit_card_cvv,
          items: [{
            product_id: orderData.product.id,
            quantity: orderData.quantity,
            price_per_unit: orderData.product.price,
            product_name: orderData.product.name,
            image_url: orderData.product.image,
          }],
          total_amount: orderData.product.price * orderData.quantity,
          status: "pending"
        })
      });
  
      if (response.success) {
        showSuccess('Order placed successfully!');
      } else {
        showError('Failed to place order: ' + (response.error || 'Unknown error'));
      }
    } catch (err) {
      showError('Error placing order: ' + err.message);
    }
  };
  
  const selectedShapeData = bodyShapes.find(shape => shape.id === selectedShape) || {};

  return (
    <div className="luxury-body-shape-page">
      {!selectedShape ? (
        <>
          <header className="luxury-page-header">
            <h1 className="luxury-page-title">Discover Your Perfect Style</h1>
            <p className="luxury-page-subtitle">
              Select your body shape to explore curated fashion recommendations that highlight your best features.
            </p>
          </header>
          <div className="luxury-shapes-grid">
            {bodyShapes.map((shape) => (
              <article key={shape.id} className="luxury-shape-card" onClick={() => handleSelect(shape.id)}>
                <div className="luxury-shape-image-container">
                  <img
                    src={getProductImage(shape.image)}
                    alt={shape.name}
                    className="luxury-shape-image"
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
        <div className="products-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          <button className="luxury-explore-btn" onClick={handleBack} style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center' }}>
            <FaChevronLeft style={{ marginRight: '8px' }} /> Back to Shapes
          </button>
          <h2 style={{
            fontFamily: 'var(--font-primary)', fontSize: '2.2rem', fontWeight: '400',
            marginBottom: '2rem', textAlign: 'center', position: 'relative', paddingBottom: '1rem'
          }}>
            Curated for {selectedShapeData?.name || 'Your Shape'}
            <span style={{
              position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)',
              width: '60px', height: '2px', backgroundColor: 'var(--color-gold)'
            }}></span>
          </h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'var(--font-body)', fontSize: '1.1rem', color: '#777' }}>
              Loading curated selections...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#d32f2f', fontFamily: 'var(--font-body)' }}>{error}</div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', fontStyle: 'italic', color: '#777', fontFamily: 'var(--font-body)' }}>
              No products found for this shape. Please check back soon for new arrivals.
            </div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '2rem', padding: '1rem 0'
            }}>
              {products.map((product) => (
                <article key={product.id}
                  style={{
                    background: 'white', border: '1px solid rgba(0,0,0,0.05)', transition: 'all 0.3s',
                    cursor: 'pointer', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column'
                  }}
                  onClick={() => openProductModal(product)}
                >
                  <div style={{ position: 'relative', paddingTop: '125%', overflow: 'hidden', backgroundColor: 'var(--color-ivory)' }}>
                    <img
                      src={getProductImage(product.image)}
                      alt={product.name}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                      onError={e => { e.target.onerror = null; e.target.src = process.env.PUBLIC_URL + '/images/placeholder-product.jpg'; }}
                    />
                  </div>
                  <div style={{
                    padding: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                  }}>
                    <div>
                      <h3 style={{
                        margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: '500',
                        fontFamily: 'var(--font-secondary)', color: 'var(--color-charcoal)', letterSpacing: '0.5px'
                      }}>
                        {product.name}
                      </h3>
                      <div style={{
                        color: '#888', fontSize: '0.9rem', marginBottom: '0.8rem', fontFamily: 'var(--font-body)'
                      }}>
                        {product.category || 'Fashion'}
                      </div>
                      <div style={{
                        color: 'var(--color-charcoal)', fontSize: '1.1rem', fontWeight: '500',
                        margin: '0.5rem 0', fontFamily: 'var(--font-secondary)'
                      }}>
                        ₪{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                      </div>
                    </div>
                    <button
                      style={{
                        background: '#efefef', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9rem',
                        fontFamily: 'var(--font-secondary)', borderRadius: 6, padding: '6px 14px', marginTop: 14
                      }}
                      onClick={e => { e.stopPropagation(); handleAddToCart(product); }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {/* Product Modal */}
          {selectedProduct && (
            <ProductModal
              product={selectedProduct}
              onClose={closeModal}
              onAddToCart={handleAddToCart}
              onOrderNow={handleOrderNow}   // هنا تضيف الدالة

            />
          )}
        </div>
      )}
    </div>
  );
};

export default BodyShapePage;

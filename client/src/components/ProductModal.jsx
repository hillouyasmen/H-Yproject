import React, { useState, useEffect } from 'react';
import './ProductModal.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getImageUrls } from '../utils/imageUtils';

const ProductModal = ({ product, onClose, onAddToCart, onOrderNow }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Get image URLs using the utility function
  const imageUrls = getImageUrls(product);
  const hasMultipleImages = imageUrls.length > 1;
  
  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };
  
  const navigateImage = (direction) => {
    setCurrentImageIndex(prevIndex => {
      if (direction === 'prev') {
        return prevIndex === 0 ? imageUrls.length - 1 : prevIndex - 1;
      } else {
        return prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1;
      }
    });
  };
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  useEffect(() => {
    // منع تمرير الخلفية عند فتح النافذة
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        customerInfo: formData,
        status: 'pending',
        orderDate: new Date().toISOString()
      };
      
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      localStorage.setItem('orders', JSON.stringify([...existingOrders, orderData]));
      
      // Show success message in the UI
      const successMessage = document.createElement('div');
      successMessage.className = 'success-message';
      successMessage.textContent = 'Order placed successfully!';
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        successMessage.remove();
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error placing order:', error);
      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-message';
      errorMessage.textContent = 'Failed to place order. Please try again.';
      document.body.appendChild(errorMessage);
      
      setTimeout(() => {
        errorMessage.remove();
      }, 3000);
    }
  };

  const handleAddToCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = cart.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        cart[existingItemIndex].quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      // Trigger custom event to notify other components
      window.dispatchEvent(new Event('cartUpdated'));
      onAddToCart && onAddToCart(cart);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (!product) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>

        {!showOrderForm ? (
          <div className="product-details">
            <div className="product-image">
              {hasMultipleImages && (
                <button 
                  className="nav-arrow left"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('prev');
                  }}
                >
                  <FaChevronLeft />
                </button>
              )}
              
              <img 
                src={imageUrls[currentImageIndex] || '/images/placeholder-product.jpg'} 
                alt={product.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/placeholder-product.jpg';
                }}
                className="main-product-image"
              />
              
              {hasMultipleImages && (
                <button 
                  className="nav-arrow right"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('next');
                  }}
                >
                  <FaChevronRight />
                </button>
              )}
              
              {hasMultipleImages && (
                <div className="thumbnail-gallery">
                  {imageUrls.map((url, index) => (
                    <div 
                      key={index}
                      className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => handleThumbnailClick(index)}
                    >
                      <img 
                        src={imageUrl.startsWith('http') ? imageUrl : `${process.env.PUBLIC_URL}${imageUrl}`} 
                        alt={`${product.name} - Image ${index + 1}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `${process.env.PUBLIC_URL}/images/placeholder-product.jpg`;
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="product-info">
              <h2>{product.name}</h2>
              <p className="price">₪{product.price}</p>
              <p className="description">{product.description}</p>
              <div className="product-actions">
                <button 
                  className="btn add-to-cart"
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </button>
                <button 
                  className="btn order-now"
                  onClick={() => setShowOrderForm(true)}
                >
                  Order Now
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="order-form-container">
            <h2>Complete Your Order</h2>
            <form onSubmit={handleSubmit} className="order-form">
              <div className="form-group">
                <h3>Shipping Information</h3>
                <div className="form-row">
                  <div className="form-field">
                    <label>Full Name</label>
                    <input 
                      type="text" name="name" value={formData.name}
                      onChange={handleInputChange} required
                    />
                  </div>
                  <div className="form-field">
                    <label>Email</label>
                    <input 
                      type="email" name="email" value={formData.email}
                      onChange={handleInputChange} required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Phone Number</label>
                    <input 
                      type="tel" name="phone" value={formData.phone}
                      onChange={handleInputChange} required
                    />
                  </div>
                  <div className="form-field">
                    <label>City</label>
                    <input 
                      type="text" name="city" value={formData.city}
                      onChange={handleInputChange} required
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label>Full Address</label>
                  <textarea 
                    name="address" value={formData.address}
                    onChange={handleInputChange} required rows="3"
                  />
                </div>
                <div className="form-field">
                  <label>Postal Code</label>
                  <input 
                    type="text" name="postalCode" value={formData.postalCode}
                    onChange={handleInputChange} required
                  />
                </div>
              </div>

              <div className="form-group">
                <h3>Payment Information</h3>
                <div className="form-field">
                  <label>Card Number</label>
                  <input 
                    type="text" name="cardNumber" value={formData.cardNumber}
                    onChange={handleInputChange} placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Expiry Date</label>
                    <input 
                      type="text" name="expiryDate" value={formData.expiryDate}
                      onChange={handleInputChange} placeholder="MM/YY" required
                    />
                  </div>
                  <div className="form-field">
                    <label>CVV</label>
                    <input 
                      type="text" name="cvv" value={formData.cvv}
                      onChange={handleInputChange} placeholder="123" required
                    />
                  </div>
                </div>
              </div>

              <div className="order-summary">
                <h3>Order Summary</h3>
                <div className="summary-item">
                  <span>Subtotal</span>
                  <span>${product.price}</span>
                </div>
                <div className="summary-item">
                  <span>Shipping</span>
                  <span>$0.00</span>
                </div>
                <div className="summary-item total">
                  <span>Total</span>
                  <span>${product.price}</span>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowOrderForm(false)}
                >
                  Back
                </button>
                <button type="submit" className="btn btn-primary">
                  Place Order
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductModal;

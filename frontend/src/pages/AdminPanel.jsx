import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminPanel.css';

// Configure axios base URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');

const AdminPanel = () => {
  // State variables
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: '',
    stock: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/products', newProduct);
      setProducts([...products, response.data]);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        image: '',
        category: '',
        stock: ''
      });
      setMessage({ type: 'success', text: 'מוצר נוסף בהצלחה!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'שגיאה בהוספת המוצר' });
    }
  };

  // Product management functions
  const handleDelete = async (productId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את המוצר?')) {
      try {
        await axios.delete(`/api/products/${productId}`);
        setProducts(products.filter(product => product._id !== productId));
        setMessage({ type: 'success', text: 'מוצר נמחק בהצלחה!' });
      } catch (error) {
        setMessage({ type: 'error', text: 'שגיאה במחיקת המוצר' });
      }
    }
  };

  // Effects
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="admin-panel">
      <h2>ניהול מוצרים</h2>

      {/* Product Upload Form */}
      <div className="upload-section">
        <h3>הוספת מוצר חדש</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>שם המוצר</label>
            <input
              type="text"
              name="name"
              value={newProduct.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>תיאור</label>
            <textarea
              name="description"
              value={newProduct.description}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>מחיר</label>
            <input
              type="number"
              name="price"
              value={newProduct.price}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>קטגוריה</label>
            <select
              name="category"
              value={newProduct.category}
              onChange={handleInputChange}
              required
            >
              <option value="">בחר קטגוריה</option>
              <option value="men">גברים</option>
              <option value="women">נשים</option>
              <option value="kids">ילדים</option>
            </select>
          </div>
          <div className="form-group">
            <label>כמות במלאי</label>
            <input
              type="number"
              name="stock"
              value={newProduct.stock}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>תמונה</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              required
            />
          </div>
          {newProduct.image && (
            <div className="image-preview">
              <img src={newProduct.image} alt="Preview" />
            </div>
          )}
          <button type="submit">הוסף מוצר</button>
        </form>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Products Grid */}
      <div className="section">
        <h3>מוצרים קיימים</h3>
        <div className="grid-container">
          {products.map((product) => (
            <div key={product._id} className="product-card">
              <img src={product.image} alt={product.name} />
              <h4>{product.name}</h4>
              <p>{product.description}</p>
              <div className="product-info">
                <span>מחיר: {product.price} ₪</span>
                <span>מלאי: {product.stock}</span>
              </div>
              <div className="product-actions">
                <Link to={`/admin/products/edit/${product._id}`}>
                  <button>ערוך</button>
                </Link>
                <button
                  onClick={() => handleDelete(product._id)}
                  className="delete-btn"
                >
                  מחק
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
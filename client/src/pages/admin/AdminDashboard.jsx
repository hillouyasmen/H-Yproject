import React, { useState, useEffect } from 'react';
import { FaBox, FaUsers, FaShoppingCart, FaChartBar, FaSignOutAlt, FaSearch, FaEdit, FaTrash, FaPlus, FaTimes, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatShapeName, toDatabaseShapeFormat } from '../../utils/formatUtils';
import { getProductImage } from '../../utils/imageUtils';
import '../../styles/admin/AdminDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Product Form Component
const ProductForm = ({ product, onSave, onCancel }) => {
  // Available categories for the dropdown
  const categories = [
    { id: 1, name: 'Pajamas' },
    { id: 2, name: 'Dresses' },
    { id: 3, name: 'Shirts' },
    { id: 4, name: 'Pants' }
  ];

  // Initialize form data with product data or empty values
  const [formData, setFormData] = useState(() => {
    // If we have a product with an image URL that's a number, convert it to the new format
    let imagePreview = product?.image_url || '';
    
    // If the image_url is a number, convert it to the F1-F10 format
    if (product?.image_url && !isNaN(parseInt(product.image_url, 10))) {
      const id = parseInt(product.image_url, 10);
      const imageNumber = ((id - 1) % 10) + 1; // Cycle through 1-10
      imagePreview = `F${imageNumber}.jpg`;
    }
    
    return {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price?.toString() || '',
      category: product?.category?.toString() || '',
      body_shape: product?.body_shape || '',
      stock: product?.stock_quantity?.toString() || '0',
      image: null,
      imagePreview: imagePreview
    };
  });
  const [isUploading, setIsUploading] = useState(false);

  // Update form data when product prop changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        category: product.category?.toString() || '',
        body_shape: product.body_shape || '',
        stock: product.stock_quantity?.toString() || '0',
        image: null,
        imagePreview: product.image_url || ''
      });
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        body_shape: '',
        stock: '0',
        image: null,
        imagePreview: ''
      });
    }
  }, [product]);

  useEffect(() => {
    if (formData.image) {
      // If it's a file, create a preview
      if (formData.image instanceof File) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            imagePreview: reader.result
          }));
        };
        reader.readAsDataURL(formData.image);
      } else {
        // If it's a string (F1-F10), update the preview
        setFormData(prev => ({
          ...prev,
          imagePreview: formData.image
        }));
      }
    }
  }, [formData.image]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For number fields, keep as string to avoid losing decimal places
    const newValue = (name === 'price' || name === 'stock') 
      ? value // Keep as string to preserve decimal places
      : value;
      
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.price || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('body_shape', formData.body_shape);
      formDataToSend.append('stock_quantity', formData.stock);
      
      // Only append the image if it's a new one
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      } else if (product?.id) {
        // If editing and no new image, keep the existing image reference
        formDataToSend.append('image_url', product.image_url || '');
      } else if (formData.imagePreview) {
        // If it's an HTTP URL or base64, send as image_url
        if (formData.imagePreview.startsWith('http') || formData.imagePreview.startsWith('data:image')) {
          formDataToSend.append('image_url', formData.imagePreview);
        } else if (formData.imagePreview) {
          // If it's a local path, just send the filename
          const filename = formData.imagePreview.split('/').pop();
          formDataToSend.append('image_url', filename);
        }
      }
      
      // Log the payload for debugging
      console.log('Submitting product with data:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value);
      }
      
      await onSave(formDataToSend);
      
    } catch (error) {
      console.error('Error saving product:', error);
      // The error is already handled in handleSaveProduct
    } finally {
      setIsUploading(false);
    }
  };

  // Available body shapes for the dropdown
  const bodyShapes = [
    { value: 'apple', label: 'Apple' },
    { value: 'pear', label: 'Pear' },
    { value: 'hourglass', label: 'Hourglass' },
    { value: 'rectangle', label: 'Rectangle' },
    { value: 'inverted_triangle', label: 'Inverted Triangle' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onCancel} className="close-btn" aria-label="Close">
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Enter product name"
              />
            </div>
            
            <div className="form-group">
              <label>Category *</label>
              <select
                className="form-control"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Price *</label>
              <div className="input-with-symbol">
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="form-control"
                  placeholder="0.00"
                />
                <span className="input-symbol">₪</span>
              </div>
            </div>
            
            <div className="form-group">
              <label>Stock *</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                required
                className="form-control"
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Body Shape</label>
            <select
              className="form-control"
              name="body_shape"
              value={formData.body_shape}
              onChange={handleChange}
            >
              <option value="">Select Body Shape (Optional)</option>
              {bodyShapes.map((shape) => (
                <option key={shape.value} value={shape.value}>
                  {shape.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-control"
              rows="3"
              placeholder="Enter product description (optional)"
            />
          </div>
          
          <div className="form-group">
            <label>Product Image {!product && '*'}</label>
            <div className="image-upload-container">
              {formData.imagePreview ? (
                <div className="image-preview">
                  <img 
                    src={formData.imagePreview} 
                    alt="Preview" 
                    className="preview-image"
                  />
                  <label className="upload-btn">
                    Change Image
                    <input
                      type="file"
                      name="image"
                      onChange={handleImageChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              ) : (
                <label className="upload-area">
                  <FaPlus className="upload-icon" />
                  <span>Click to upload an image</span>
                  <input
                    type="file"
                    name="image"
                    onChange={handleImageChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                    required={!product}
                  />
                </label>
              )}
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={onCancel} 
              className="btn btn-outline"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <FaSpinner className="spinner" />
                  {product ? 'Saving...' : 'Adding...'}
                </>
              ) : product ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Mock data for development
const generateMockOrders = () => {
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const products = [
    { id: 1, name: 'Product 1', price: 99.99 },
    { id: 2, name: 'Product 2', price: 149.99 },
    { id: 3, name: 'Product 3', price: 199.99 },
  ];

  return Array(10).fill(0).map((_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items
    
    const items = Array(itemCount).fill(0).map((_, idx) => {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        total: (product.price * quantity).toFixed(2)
      };
    });

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return {
      id: 1000 + i,
      customer_name: `Customer ${i + 1}`,
      customer_email: `customer${i + 1}@example.com`,
      status,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      items,
      total: total.toFixed(2)
    };
  });
};

const generateMockProducts = () => {
  return Array(10).fill(0).map((_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: (Math.random() * 100 + 10).toFixed(2),
    stock: Math.floor(Math.random() * 100),
    category: ['Electronics', 'Clothing', 'Home', 'Books', 'Toys', 'Beauty', 'Sports', 'Automotive'][i % 8],
    created_at: new Date().toISOString()
  }));
};

const generateMockUsers = () => {
  return Array(5).fill(0).map((_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i === 0 ? 'admin' : 'user',
    created_at: new Date().toISOString()
  }));
};

const AdminDashboard = () => {
  // Add product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({
    users: [],
    products: [],
    orders: []
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Navigation items
  const navItems = [
    { id: 'dashboard', icon: <FaChartBar />, label: 'Dashboard' },
    { id: 'orders', icon: <FaShoppingCart />, label: 'Orders' },
    { id: 'products', icon: <FaBox />, label: 'Products' },
    { id: 'users', icon: <FaUsers />, label: 'Users' },
  ];

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update order status');
      
      // Update local state
      setData(prev => ({
        ...prev,
        orders: prev.orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      }));
      
      alert(`Order #${orderId} status updated to: ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  // Delete order
  const deleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to delete order');
        
        // Update local state
        setData(prev => ({
          ...prev,
          orders: prev.orders.filter(order => order.id !== orderId)
        }));
        
        alert(`Order #${orderId} has been deleted`);
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order. Please try again.');
      }
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json();
      if (data.success) {
        // Ensure all products have an image URL
        const productsWithImages = data.data.map(product => ({
          ...product,
          image_url: product.image_url || `https://placehold.co/150x150?text=${encodeURIComponent(product.name)}`
        }));
        setData(prev => ({ ...prev, products: productsWithImages }));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle save product
  const handleSaveProduct = async (formData) => {
    try {
      // Log the incoming form data for debugging
      console.log('Form data received in handleSaveProduct:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      // Get all form data values
      const name = formData.get('name')?.toString().trim();
      const price = formData.get('price');
      const category = formData.get('category');
      const body_shape = formData.get('body_shape');
      const stock_quantity = formData.get('stock_quantity') || formData.get('stock') || '0';
      const description = formData.get('description') || '';
      const image_file = formData.get('image');
      const image_url = formData.get('image_url');
      
      console.log('Parsed values:', { name, price, category, body_shape, stock_quantity, description, hasImageFile: !!image_file, image_url });
      
      // Validate required fields
      if (!name) throw new Error('Product name is required');
      if (!price) throw new Error('Price is required');
      if (!category) throw new Error('Category is required');
      
      // Validate price format
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error('Price must be a valid positive number');
      }
      
      // Create a new FormData object with all fields
      const requestData = new FormData();
      
      // Add all fields to the form data
      requestData.append('name', name);
      requestData.append('description', description);
      requestData.append('price', priceNum.toString());
      requestData.append('category', category);
      requestData.append('body_shape', body_shape || '');
      requestData.append('stock_quantity', stock_quantity);
      
      // Handle image file if present
      if (image_file && (image_file.name || image_file.size > 0)) {
        // New image file was uploaded
        requestData.append('image', image_file);
      } else if (image_url) {
        // Use the existing image URL
        const filename = image_url.split('/').pop();
        requestData.append('image_url', filename);
      }
      
      // Determine the URL and method based on whether we're creating or updating
      const url = editingProduct 
        ? `${API_BASE_URL}/products/${editingProduct.id}`
        : `${API_BASE_URL}/products`;
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      // Log the request data for debugging
      console.log('Sending request to:', url);
      console.log('Method:', method);
      for (let [key, value] of requestData.entries()) {
        console.log(`${key}:`, value);
      }
      
      // Get the auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Make the API request
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type header - let the browser set it with the correct boundary
        },
        body: requestData
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        responseData = {};
      }
      
      if (!response.ok) {
        const errorMessage = responseData.error || 
                           responseData.message || 
                           `Server responded with status ${response.status}`;
        throw new Error(errorMessage);
      }

      // Refresh products
      await fetchProducts();
      setShowProductForm(false);
      setEditingProduct(null);
      setError(null);
      
      // Show success message
      setSuccess(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      return responseData;
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.message || 'Failed to save product. Please try again.');
      throw error; // Re-throw to be caught by the form's error handling
    }
  };

  // Handle delete product
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to delete product');
        
        // Refresh products
        await fetchProducts();
        
      } catch (error) {
        console.error('Error deleting product:', error);
        setError('Failed to delete product');
      }
    }
  };

  // Fetch all data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
          throw new Error('No authentication token found');
        }

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        // Fetch all data in parallel
        const [ordersRes, productsRes, usersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/orders?includeItems=true`, { headers }),
          fetch(`${API_BASE_URL}/products`, { headers }),
          fetch(`${API_BASE_URL}/users`, { headers })
        ]);

        if (!ordersRes.ok) throw new Error('Failed to fetch orders');
        if (!productsRes.ok) throw new Error('Failed to fetch products');
        if (!usersRes.ok) throw new Error('Failed to fetch users');

        const [ordersData, productsData, usersData] = await Promise.all([
          ordersRes.json(),
          productsRes.json(),
          usersRes.json()
        ]);

        // Transform data to match expected format
        const formattedOrders = (ordersData.data || ordersData).map(order => ({
          ...order,
          date: order.created_at,
          customer: order.customer_name || `Customer ${order.user_id}`,
          email: order.customer_email,
          status: order.status || 'pending',
          items: order.items || [],
          total: order.total_amount
        }));

        setData({
          users: usersData.data || usersData || [],
          products: productsData.data || productsData || [],
          orders: formattedOrders
        });

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Filter data based on search term and status
  const filteredData = {
    users: data.users.filter(user => 
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    products: data.products.filter(product => 
      (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    orders: data.orders.filter(order => {
      if (!order) return false;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (order.customer_name && order.customer_name.toLowerCase().includes(searchLower)) ||
        (order.id && order.id.toString().includes(searchTerm)) ||
        (order.status && order.status.toLowerCase().includes(searchLower)) ||
        (order.customer_email && order.customer_email.toLowerCase().includes(searchLower));
      
      const matchesStatus = statusFilter === 'all' || (order.status && order.status === statusFilter);
      
      return matchesSearch && matchesStatus;
    })
  };

  // Handle edit product
  const handleEditProduct = (product) => {
    setEditingProduct({
      ...product,
      // Ensure we have an image URL for the form
      image_url: product.image_url || '',
      // Initialize form data with existing product data
      name: product.name || '',
      description: product.description || '',
      price: parseFloat(product.price) || '',
      body_shape: product.body_shape || '',
      stock: product.stock || 0
    });
    setShowProductForm(true);
  };

  // Open add product form
  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  // Render products tab
  const renderProductsTab = () => {
    return (
      <div className="tab-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Products</h2>
          <button 
            onClick={handleAddProduct}
            className="btn btn-primary"
          >
            <FaPlus /> Add Product
          </button>
        </div>
        
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Body Shape</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.products.length > 0 ? (
                filteredData.products.map(product => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td className="product-cell">
                      <div className="product-info">
                        <img 
                          src={getProductImageSource(product.image_url)} 
                          alt={product.name}
                          className="product-thumbnail"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `${process.env.PUBLIC_URL}/images/placeholder-product.jpg`;
                          }}
                        />
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td>${product.price}</td>
                    <td>
                      <span className={`stock-badge ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </td>
                    <td className="body-shape">
                      {formatShapeName(product.body_shape) || '-'}
                    </td>
                    <td className="actions">
                      <button 
                        onClick={() => handleEditProduct(product)}
                        className="btn btn-sm btn-outline-primary mr-2"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="btn btn-sm btn-outline-danger"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No products found. Click 'Add Product' to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Get the appropriate image source for a product
  const getProductImageSource = (imageUrl) => {
    if (!imageUrl) return `${process.env.PUBLIC_URL}/images/placeholder-product.jpg`;
    
    // If it's already a full URL, use it
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // If it's a number, use F1-F10 based on the ID
    if (!isNaN(parseInt(imageUrl, 10))) {
      const id = parseInt(imageUrl, 10);
      const imageNumber = ((id - 1) % 10) + 1; // Cycle through 1-10
      return `${process.env.PUBLIC_URL}/images/products/F${imageNumber}.jpg`;
    }
    
    // If it's a filename, use it as is
    if (imageUrl.includes('.')) {
      return `${process.env.PUBLIC_URL}/images/products/${imageUrl}`;
    }
    
    // Default fallback
    return `${process.env.PUBLIC_URL}/images/placeholder-product.jpg`;
  };

  // Render dashboard stats
  const renderDashboardStats = () => (
    <div className="dashboard-stats">
      <div className="stat-card">
        <h3>Total Orders</h3>
        <p className="stat-number">{data.orders.length}</p>
      </div>
      <div className="stat-card">
        <h3>Revenue</h3>
        <p className="stat-number">
          ${(data.orders.reduce((total, order) => {
            const orderTotal = typeof order.total === 'number' ? order.total : 
                             parseFloat(order.total) || 0;
            return total + orderTotal;
          }, 0)).toFixed(2)}
        </p>
      </div>
    </div>
  );

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Dashboard Overview</h2>
            {renderDashboardStats()}
          </div>
        );

      case 'products':
        return renderProductsTab();

      case 'users':
        return (
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.users.map(user => (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-2">{user.id}</td>
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'orders':
      return (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Orders</h2>
            <div className="flex space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded px-3 py-1"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.orders.length > 0 ? (
                  filteredData.orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.customer}</div>
                        <div className="text-sm text-gray-500">{order.email || 'No email'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.items?.length || 0} items</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${order.total}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'shipped' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => updateOrderStatus(order.id, 'processing')}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                        >
                          Process
                        </button>
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'products':
      return renderProductsTab();

    default:
      return <div>Page not found</div>;
    }
  };

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="admin-dashboard">
      {/* Success Message */}
      {success && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
          <div className="flex items-center">
            <span className="mr-2">✓</span>
            <span>{success}</span>
          </div>
        </div>
      )}
      
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        />
      )}
      
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="user-info">
          <div className="user-avatar">
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.name || 'Admin'}</span>
            <span className="user-role">Administrator</span>
          </div>
          <button onClick={logout} className="logout-btn">
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="sidebar">
        <nav className="nav-menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <button className="nav-item logout" onClick={logout}>
            <span className="nav-icon"><FaSignOutAlt /></span>
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {navItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
          </h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
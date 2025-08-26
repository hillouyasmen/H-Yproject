import React, { useState, useEffect } from 'react';
import { FaBox, FaUsers, FaShoppingCart, FaSignOutAlt, FaEdit, FaTrash, FaPlus, FaSearch, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/admin/AdminDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const tabs = [
  { id: 'products', label: 'Products', icon: <FaBox /> },
  { id: 'orders', label: 'Orders', icon: <FaShoppingCart /> },
  { id: 'users', label: 'Users', icon: <FaUsers /> }
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState('products');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Data state
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  // Product Form State
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', price: '', category: '',
    stock_quantity: '', image_url: '', sku: '', color_id: '', size_id: '', body_shape: ''
  });
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);

  // Fetch Data
  useEffect(() => {
    if (!user) return navigate('/login');
    fetchAll();
    // eslint-disable-next-line
  }, [tab]);

  const fetchAll = async () => {
    setIsLoading(true); setError('');
    const token = localStorage.getItem('token');
    try {
      if (tab === 'products') {
        const res = await fetch(`${API_BASE_URL}/products`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setProducts(data.data || []);
      } else if (tab === 'orders') {
        const res = await fetch(`${API_BASE_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setOrders(data.data || []);
      } else if (tab === 'users') {
        const res = await fetch(`${API_BASE_URL}/users`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setUsers(data.data || []);
      }
    } catch (e) {
      setError(e.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Image Upload Handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setForm(prev => ({ ...prev, image_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Product
  const saveProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = editing === 'new'
      ? `${API_BASE_URL}/products`
      : `${API_BASE_URL}/products/${editing.id}`;
    const method = editing === 'new' ? 'POST' : 'PUT';
    let imageUrl = form.image_url;

    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.imageUrl || imageUrl;
        }
      } catch {
        // Ignore and use base64 fallback
      }
    }

    const productData = { ...form, image_url: imageUrl };
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(productData)
      });
      if (!response.ok) throw new Error('Failed to save product');
      setEditing(null);
      setImagePreview('');
      setImageFile(null);
      fetchAll();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    }
  };

  // Edit/Delete Product
  const editProduct = (product) => {
    setEditing(product);
    setForm({
      name: product.name || '', description: product.description || '', price: product.price || '',
      category: product.category || '', stock_quantity: product.stock_quantity || '',
      image_url: product.image_url || '', sku: product.sku || '', color_id: product.color_id || '',
      size_id: product.size_id || '', body_shape: product.body_shape || ''
    });
    setImagePreview(product.image_url || '');
    setImageFile(null);
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  };

  // Filtered Data
  const filteredProducts = products.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredOrders = orders.filter(o =>
    (o.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.status || '').toLowerCase().includes(search.toLowerCase())
  );

  // Renderers
  const renderProductsTab = () => (
    <div>
      <h2>Products</h2>
      <div className="search-bar">
        <FaSearch />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." />
      </div>
      <button onClick={() => setEditing('new')} className="add-product-btn"><FaPlus /> Add Product</button>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id}>
                <td>
                  <img src={product.image_url || '/placeholder-product.png'} alt={product.name} className="product-image" />
                </td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>${product.price}</td>
                <td>{product.stock_quantity}</td>
                <td>
                  <button onClick={() => editProduct(product)} className="edit-btn"><FaEdit /></button>
                  <button onClick={() => deleteProduct(product.id)} className="delete-btn"><FaTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <form className="product-form" onSubmit={saveProduct} style={{ margin: '1rem 0', background: '#fafafa', padding: 16, borderRadius: 8, maxWidth: '600px' }}>
          <div style={{ marginBottom: '1rem' }}>
            <div>Product Image:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {(imagePreview || form.image_url) && (
                <img src={imagePreview || form.image_url} alt="Preview" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }} />
              )}
              <label className="file-upload-btn">
                Choose Image
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              </label>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <input required placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input required type="number" step="0.01" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          </div>
          <textarea required placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="3" style={{ width: '100%' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <input required placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            <input required type="number" placeholder="Stock" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} />
            <input placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => { setEditing(null); setImagePreview(''); setImageFile(null); }}>Cancel</button>
            <button type="submit">{editing === 'new' ? 'Add Product' : 'Save Changes'}</button>
          </div>
        </form>
      )}
    </div>
  );

  const renderOrdersTab = () => (
    <div>
      <h2>Orders</h2>
      <div className="search-bar"><FaSearch /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." /></div>
      <div className="table-container">
        <table>
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.customer_name}</td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>${order.total_amount || order.total}</td>
                <td>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div>
      <h2>Users</h2>
      <div className="search-bar"><FaSearch /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." /></div>
      <div className="table-container">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.status || 'Active'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Main Render
  return (
    <div className="admin-dashboard">
      {/* Top Tabs Navigation */}
      <nav className="admin-nav">
        {tabs.map(({ id, label, icon }) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{icon} {label}</button>
        ))}
        <button style={{ marginLeft: 'auto' }} onClick={logout}><FaSignOutAlt /> Logout</button>
      </nav>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '2rem 0' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 50 }}><FaSpinner className="animate-spin" style={{ fontSize: 32, color: '#7a47c2' }} /></div>
        ) : error ? (
          <div style={{ color: '#d32f2f', background: '#fff3f3', padding: 18, borderRadius: 8, textAlign: 'center', fontWeight: 500 }}>{error}</div>
        ) : (
          <>
            {tab === 'products' && renderProductsTab()}
            {tab === 'orders' && renderOrdersTab()}
            {tab === 'users' && renderUsersTab()}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

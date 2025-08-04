import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/formPage.css';

export default function FormPage() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:5001/api';

  const loadItems = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/items`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          console.log('Session expired, but login is not required');
          setItems([]);
          return;
        }
        throw new Error('נכשל בטעינת הפריטים');
      }
      
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading items:', error);
      setError(error.message || 'אירעה שגיאה בטעינת הפריטים');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Basic validation
    if (!newItem.name.trim() || !newItem.description.trim() || !newItem.price) {
      setError('יש למלא את כל השדות');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newItem)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'שגיאה בהוספת הפריט');
      }
      
      setNewItem({ name: '', description: '', price: '' });
      setSuccess('הפריט נוסף בהצלחה!');
      await loadItems();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding item:', error);
      setError(error.message || 'אירעה שגיאה בהוספת הפריט');
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) {
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/items/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          navigate('/login', { state: { message: 'הפעולה דורשת התחברות מחדש' } });
          return;
        }
        throw new Error('שגיאה במחיקת הפריט');
      }
      
      setSuccess('הפריט נמחק בהצלחה');
      await loadItems();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(error.message || 'אירעה שגיאה במחיקת הפריט');
    }
  };

  useEffect(() => { loadItems(); }, []);

  // Load items on component mount
  useEffect(() => {
    loadItems();
  }, []);

  return (
    <div className="form-container">
      <div className="form-card">
        <h2 className="form-title">ניהול פריטים</h2>
        
        {/* Error and Success Messages */}
        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')} className="close-btn">×</button>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            {success}
            <button onClick={() => setSuccess('')} className="close-btn">×</button>
          </div>
        )}
        
        {isLoading ? (
          <div className="loading-spinner">טוען נתונים...</div>
        ) : items.length === 0 ? (
          <div className="no-items">אין פריטים להצגה</div>
        ) : (
          <div className="items-list">
            {items.map(item => (
              <div key={item.item_id || item.id} className="item-card">
                <div className="item-details">
                  <h3 className="item-name">{item.name}</h3>
                  <p className="item-description">{item.description}</p>
                  <span className="item-price">₪{item.price}</span>
                </div>
                <button 
                  className="delete-btn"
                  onClick={() => deleteItem(item.item_id || item.id)}
                  aria-label="מחק פריט"
                  title="מחק פריט"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="add-item-section">
          <h3 className="section-title">הוסף פריט חדש</h3>
          <form onSubmit={addItem} className="item-form">
            <div className="form-group">
              <label htmlFor="itemName">שם הפריט</label>
              <input 
                id="itemName"
                className="form-input"
                placeholder="לדוגמה: חולצה אדומה" 
                value={newItem.name} 
                onChange={e => setNewItem({ ...newItem, name: e.target.value })} 
                required
                minLength="2"
                maxLength="50"
              />
            </div>
            <div className="form-group">
              <label htmlFor="itemDescription">תיאור</label>
              <input 
                id="itemDescription"
                className="form-input"
                placeholder="תיאור מפורט של הפריט" 
                value={newItem.description} 
                onChange={e => setNewItem({ ...newItem, description: e.target.value })} 
                required
                minLength="3"
                maxLength="200"
              />
            </div>
            <div className="form-group">
              <label htmlFor="itemPrice">מחיר (בשקלים)</label>
              <div className="price-input-container">
                <input 
                  id="itemPrice"
                  className="form-input price-input"
                  type="number"
                  placeholder="0.00" 
                  value={newItem.price} 
                  onChange={e => setNewItem({ ...newItem, price: e.target.value })} 
                  min="0"
                  step="0.01"
                  required
                />
                <span className="currency-symbol">₪</span>
              </div>
            </div>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'מוסיף...' : 'הוסף פריט'}
            </button>
          </form>
        </div>
        
        <button 
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          חזרה לדף הבית
        </button>
      </div>
    </div>
  );
}

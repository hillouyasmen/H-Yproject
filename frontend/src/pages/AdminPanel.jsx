import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminPanel.css";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
      navigate("/admin-login");
    }
    fetchProducts();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage("נא לבחור תמונה");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("name", e.target.name.value);
    formData.append("description", e.target.description.value);
    formData.append("price", e.target.price.value);
    formData.append("category", e.target.category.value);

    try {
      const response = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("המוצר נוסף בהצלחה");
        setSelectedFile(null);
        setPreview(null);
        e.target.reset();
        fetchProducts();
      } else {
        setMessage(data.message || "שגיאה בהוספת המוצר");
      }
    } catch (error) {
      setMessage("שגיאת שרת");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel">
      <h2>פאנל ניהול</h2>
      
      <div className="upload-section">
        <h3>הוספת מוצר חדש</h3>
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label htmlFor="name">שם המוצר</label>
            <input type="text" id="name" name="name" required />
          </div>

          <div className="form-group">
            <label htmlFor="description">תיאור</label>
            <textarea id="description" name="description" required />
          </div>

          <div className="form-group">
            <label htmlFor="price">מחיר</label>
            <input type="number" id="price" name="price" required />
          </div>

          <div className="form-group">
            <label htmlFor="category">קטגוריה</label>
            <select id="category" name="category" required>
              <option value="dresses">שמלות</option>
              <option value="tops">חולצות</option>
              <option value="bottoms">מכנסיים וחצאיות</option>
              <option value="outerwear">מעילים</option>
              <option value="formal">בגדים אלגנטיים</option>
              <option value="beachwear">בגדי ים</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="image">תמונה</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleFileSelect}
              required
            />
          </div>

          {preview && (
            <div className="image-preview">
              <img src={preview} alt="תצוגה מקדימה" />
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "מעלה..." : "הוסף מוצר"}
          </button>
        </form>

        {message && <div className="message">{message}</div>}
      </div>

      <div className="products-list">
        <h3>מוצרים קיימים</h3>
        <div className="products-grid">
          {products.map((product) => (
            <div key={product._id} className="product-card">
              <img src={product.image} alt={product.name} />
              <h4>{product.name}</h4>
              <p>{product.price} ₪</p>
              <button 
                onClick={async () => {
                  if (window.confirm("האם למחוק מוצר זה?")) {
                    try {
                      await fetch(`http://localhost:5000/api/products/${product._id}`, {
                        method: "DELETE",
                      });
                      fetchProducts();
                    } catch (error) {
                      console.error("Error deleting product:", error);
                    }
                  }
                }}
              >
                מחק
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

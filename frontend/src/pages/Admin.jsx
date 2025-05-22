import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Admin.css";
import {
  TrendingUp,
  People,
  Inventory,
  AttachMoney,
  ShoppingBag,
  Category,
  Dashboard,
  Settings,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TextField, Button } from "@mui/material";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [view, setView] = useState("login");
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [recoverEmail, setRecoverEmail] = useState("");
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [salesData] = useState([
    { month: "Jan", sales: 4000, orders: 150 },
    { month: "Feb", sales: 3000, orders: 120 },
    { month: "Mar", sales: 5000, orders: 180 },
    { month: "Apr", sales: 4500, orders: 160 },
    { month: "May", sales: 6000, orders: 210 },
    { month: "Jun", sales: 5500, orders: 190 },
  ]);

  const [categoryData] = useState([
    { name: "Dresses", value: 35 },
    { name: "Tops", value: 25 },
    { name: "Bottoms", value: 20 },
    { name: "Outerwear", value: 15 },
    { name: "Accessories", value: 5 },
  ]);

  const [bodyTypeData] = useState([
    { name: "Hourglass", value: 40 },
    { name: "Pear", value: 25 },
    { name: "Apple", value: 20 },
    { name: "Rectangle", value: 15 },
  ]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    imageFile: null,
    imagePreview: "",
    bodyTypes: [],
    category: "",
    size: "",
    color: "",
    stock: "",
    discount: "0",
    brand: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, usersRes] = await Promise.all([
        axios.get("http://localhost:5000/api/products"),
        axios.get("http://localhost:5000/api/users"),
      ]);
      setProducts(productsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleProductChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "bodyTypes") {
      setNewProduct((prev) => ({
        ...prev,
        bodyTypes: Array.from(
          e.target.selectedOptions,
          (option) => option.value
        ),
      }));
    } else if (name === "imageFile") {
      const file = files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewProduct((prev) => ({
            ...prev,
            imageFile: file,
            imagePreview: reader.result,
            image: file.name, // שומר את שם הקובץ בשדה image
          }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      setNewProduct((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      // Add all text fields
      formData.append("name", newProduct.name);
      formData.append("description", newProduct.description);
      formData.append("price", newProduct.price);
      formData.append("category", newProduct.category);
      formData.append("size", newProduct.size);
      formData.append("color", newProduct.color);
      formData.append("stock", newProduct.stock);
      formData.append("discount", newProduct.discount);
      formData.append("brand", newProduct.brand);
      formData.append("bodyTypes", newProduct.bodyTypes.join(","));

      // Add image file if exists
      if (newProduct.imageFile) {
        formData.append("image", newProduct.imageFile);
      }

      // Log the FormData contents for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      if (editingProduct) {
        await axios.put(
          `http://localhost:5000/api/products/${editingProduct._id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        showSnackbar("המוצר עודכן בהצלחה");
      } else {
        const response = await axios.post(
          "http://localhost:5000/api/products",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        console.log("Server response:", response.data);
        showSnackbar("המוצר נוסף בהצלחה");
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error(
        "Error with product:",
        error.response ? error.response.data : error
      );
      showSnackbar("שגיאה בעיבוד המוצר", "error");
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await axios.delete(`http://localhost:5000/api/products/${productId}`);
      fetchData();
      showSnackbar("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      showSnackbar("Error deleting product", "error");
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setNewProduct({
      name: "",
      description: "",
      price: "",
      image: "",
      imageFile: null,
      imagePreview: "",
      bodyTypes: [],
      category: "",
      size: "",
      color: "",
      stock: "",
      discount: "0",
      brand: "",
    });
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Basic authentication - In a real app, this should be handled by a server
    if (
      loginData.email === "admin@hy.com" &&
      loginData.password === "admin123"
    ) {
      setIsAuthenticated(true);
      showSnackbar("Login successful");
    } else {
      showSnackbar("Invalid credentials", "error");
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      showSnackbar("Passwords do not match", "error");
      return;
    }
    // Here you would typically make an API call to register the user
    showSnackbar("Registration successful! Please log in.");
    setView("login");
  };

  const handlePasswordRecovery = (e) => {
    e.preventDefault();
    // Here you would typically make an API call to send a recovery email
    showSnackbar("Recovery instructions sent to your email");
    setView("login");
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-container">
          {view === "login" && (
            <>
              <h2>Admin Login</h2>
              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="Email"
                  variant="outlined"
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  variant="outlined"
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  sx={{ mb: 2 }}
                >
                  Login
                </Button>
              </form>
              <div
                className="auth-links"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "1rem",
                }}
              >
                <Button onClick={() => setView("register")} color="primary">
                  Create New Account
                </Button>
                <Button onClick={() => setView("recover")} color="primary">
                  Forgot Password?
                </Button>
              </div>
            </>
          )}

          {view === "register" && (
            <>
              <h2>Create Account</h2>
              <form onSubmit={handleRegister}>
                <TextField
                  fullWidth
                  label="Email"
                  variant="outlined"
                  type="email"
                  required
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, email: e.target.value })
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  variant="outlined"
                  type="password"
                  required
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      password: e.target.value,
                    })
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  variant="outlined"
                  type="password"
                  required
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      confirmPassword: e.target.value,
                    })
                  }
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  sx={{ mb: 2 }}
                >
                  Register
                </Button>
              </form>
              <Button fullWidth onClick={() => setView("login")} sx={{ mt: 1 }}>
                Back to Login
              </Button>
            </>
          )}

          {view === "recover" && (
            <>
              <h2>Password Recovery</h2>
              <form onSubmit={handlePasswordRecovery}>
                <TextField
                  fullWidth
                  label="Email"
                  variant="outlined"
                  type="email"
                  required
                  value={recoverEmail}
                  onChange={(e) => setRecoverEmail(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  sx={{ mb: 2 }}
                >
                  Send Recovery Email
                </Button>
              </form>
              <Button fullWidth onClick={() => setView("login")} sx={{ mt: 1 }}>
                Back to Login
              </Button>
            </>
          )}
        </div>
      </div>
    );
    // Sample data for charts
    return (
      <div className="admin-page">
        <div className="admin-sidebar">
          <div className="admin-logo">
            <h2>H&Y MODA</h2>
            <p>Admin Panel</p>
          </div>
          <nav className="admin-nav">
            <button
              className={`nav-item ${
                activeTab === "dashboard" ? "active" : ""
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              <Dashboard /> Dashboard
            </button>
            <button
              className={`nav-item ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              <Inventory /> Products
            </button>
            <button
              className={`nav-item ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <People /> Users
            </button>
            <button
              className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <Settings /> Settings
            </button>
          </nav>
        </div>

        <div className="admin-main">
          <div className="dashboard-header">
            <div className="header-main">
              <h1>Dashboard Overview</h1>
              <button
                className="add-product-btn"
                onClick={() => setOpenDialog(true)}
              >
                <AddIcon /> הוסף מוצר חדש
              </button>
            </div>
            <div className="date">
              {new Date().toLocaleDateString("he-IL", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon products">
                <Inventory />
              </div>
              <div className="stat-info">
                <h3>Total Products</h3>
                <p>{products.length}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon users">
                <People />
              </div>
              <div className="stat-info">
                <h3>Total Users</h3>
                <p>{users.length}</p>
                <p>Growth</p>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Sales Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#82ca9d"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Sales by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Sales by Body Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={bodyTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {bodyTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <section className="products-section">
            <h2>Products</h2>
            <div className="products-grid">
              {products.map((product) => (
                <div key={product._id} className="product-card">
                  <div className="product-image">
                    <img src={product.image} alt={product.name} />
                    <div className="product-actions">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="price">₪{product.price}</p>
                    <div className="body-types">
                      {product.bodyTypes.map((type) => (
                        <span key={type} className="body-type-tag">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="users-section">
            <h2>Users</h2>
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Body Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.email}</td>
                      <td>{user.bodyType}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            user.subscription ? "active" : "inactive"
                          }`}
                        >
                          {user.subscription ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className={`product-modal ${openDialog ? "show" : ""}`}>
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
                <button className="close-btn" onClick={handleCloseDialog}>
                  &times;
                </button>
              </div>
              <form onSubmit={handleProductSubmit} className="product-form">
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newProduct.name}
                    onChange={handleProductChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={newProduct.description}
                    onChange={handleProductChange}
                    required
                    rows="4"
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>מחיר (₪)</label>
                    <input
                      type="number"
                      name="price"
                      value={newProduct.price}
                      onChange={handleProductChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>תמונה</label>
                    <div className="image-upload-container">
                      <input
                        type="file"
                        name="imageFile"
                        onChange={handleProductChange}
                        accept="image/*"
                        required
                        className="image-upload-input"
                      />
                      {newProduct.imagePreview && (
                        <div className="image-preview">
                          <img
                            src={newProduct.imagePreview}
                            alt="תצוגה מקדימה"
                          />
                          <button
                            type="button"
                            className="delete-image-btn"
                            onClick={() =>
                              setNewProduct((prev) => ({
                                ...prev,
                                image: "",
                                imageFile: null,
                                imagePreview: "",
                              }))
                            }
                          >
                            <DeleteIcon /> מחק תמונה
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>קטגוריה</label>
                  <select
                    name="category"
                    value={newProduct.category}
                    onChange={handleProductChange}
                    required
                  >
                    <option value="">בחר קטגוריה</option>
                    <option value="dresses">שמלות</option>
                    <option value="tops">חולצות</option>
                    <option value="bottoms">מכנסיים</option>
                    <option value="outerwear">מעילים</option>
                    <option value="accessories">אקססוריז</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>מידה</label>
                    <select
                      name="size"
                      value={newProduct.size}
                      onChange={handleProductChange}
                      required
                    >
                      <option value="">בחר מידה</option>
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>צבע</label>
                    <input
                      type="text"
                      name="color"
                      value={newProduct.color}
                      onChange={handleProductChange}
                      required
                      placeholder="למשל: שחור, לבן, אדום"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>מלאי</label>
                    <input
                      type="number"
                      name="stock"
                      value={newProduct.stock}
                      onChange={handleProductChange}
                      required
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>הנחה (%)</label>
                    <input
                      type="number"
                      name="discount"
                      value={newProduct.discount}
                      onChange={handleProductChange}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>מותג</label>
                  <input
                    type="text"
                    name="brand"
                    value={newProduct.brand}
                    onChange={handleProductChange}
                    placeholder="שם המותג"
                  />
                </div>

                <div className="form-group">
                  <label>סוגי גוף מתאימים</label>
                  <div className="body-types-select">
                    {["hourglass", "pear", "apple", "rectangle"].map((type) => (
                      <label key={type} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newProduct.bodyTypes.includes(type)}
                          onChange={(e) => {
                            const updatedTypes = e.target.checked
                              ? [...newProduct.bodyTypes, type]
                              : newProduct.bodyTypes.filter((t) => t !== type);
                            setNewProduct({
                              ...newProduct,
                              bodyTypes: updatedTypes,
                            });
                          }}
                        />
                        {type === "hourglass"
                          ? "שעון חול"
                          : type === "pear"
                          ? "אגס"
                          : type === "apple"
                          ? "תפוח"
                          : "מלבן"}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleCloseDialog}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    {editingProduct ? "Update" : "Add"} Product
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className={`notification ${snackbar.open ? "show" : ""}`}>
            <div className={`notification-content ${snackbar.severity}`}>
              {snackbar.message}
              <button onClick={() => setSnackbar({ ...snackbar, open: false })}>
                &times;
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Admin;

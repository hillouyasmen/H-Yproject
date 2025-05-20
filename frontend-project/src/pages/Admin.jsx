import React, { useState, useEffect } from "react";
import axios from "axios";
import 'import "../styles/Admin.css';
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
  }
};
export default Admin;

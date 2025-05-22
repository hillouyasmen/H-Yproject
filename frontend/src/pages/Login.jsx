import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import classes from "../styles/login.module.css";
import { API_URL } from '../config';

export default function Login({ setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/user");
      }
    }
  }, [navigate]);

  // ✅ تحقق إذا كان المستخدم موجود مسبقاً
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      if (user.role === "admin") navigate("/admin");
      else navigate("/user");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    try {
      if (!formData.username || !formData.password) {
        setError("Please fill in all fields");
        return;
      }
      console.log('Sending login request to:', `${API_URL}/users/login`);
      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log('Login response:', data);

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);

      // Redirect based on role
      if (data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={classes.loginContainer}>
      <h2>Login</h2>
      {error && <p className={classes.error}>{error}</p>}
      <form onSubmit={handleSubmit} className={classes.form}>
        <input
          name="username"
          placeholder="Username"
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <button type="submit">Login</button>
        <div className={classes.links}>
          <Link to="/reset-password" className={classes.forgotPassword}>
            Forgot Password?
          </Link>
          <Link to="/signup" className={classes.signup}>
            Don't have an account? Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}

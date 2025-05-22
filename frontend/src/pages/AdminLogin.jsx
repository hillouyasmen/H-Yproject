import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminLogin.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify({ ...data.user, role: "admin" }));
        localStorage.setItem("isLoggedIn", "true");
        navigate("/admin");
      } else {
        setError(data.message || "התחברות נכשלה");
      }
    } catch (err) {
      setError("שגיאת שרת");
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <h2>כניסת מנהל</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">אימייל</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="admin-login-btn">
            התחבר
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

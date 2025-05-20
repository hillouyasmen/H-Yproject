import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import classes from "../styles/login.module.css";

export default function Login({ onLogin }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    axios.post("http://localhost:5000/api/users/login", formData)
      .then((res) => {
        if (res.data.success) {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("user", JSON.stringify(res.data.user));
          onLogin();
          navigate("/");
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || "שגיאה בהתחברות");
      });
  };

  return (
    <div className={classes.loginContainer}>
      <h2 className={classes.pageTitle}>התחברות</h2>
      <form onSubmit={handleSubmit} className={classes.loginForm}>
        <input name="username" value={formData.username} onChange={handleChange} placeholder="שם משתמש" required />
        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="סיסמה" required />
        {error && <p className={classes.errorText}>{error}</p>}
        <button type="submit" className={classes.button}>התחברות</button>
      </form>
    </div>
  );
}

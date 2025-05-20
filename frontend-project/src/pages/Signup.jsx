import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import classes from "../styles/login.module.css";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password, confirmPassword, full_name, email, phone_number } = formData;

    // Validate all required fields
    if (!username || !password || !confirmPassword || !full_name || !email || !phone_number) {
      setError("נא למלא את כל השדות");
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError("הסיסמאות לא תואמות");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/users/register",
        {
          username,
          password,
          full_name,
          email,
          phone_number
        }
      );

      if (response.data.success) {
        alert("ההרשמה הצליחה! אנא התחבר");
        navigate("/login");
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || "שגיאה בהרשמה");
    }
  };

  return (
    <div className={classes.loginContainer}>
      <h2 className={classes.pageTitle}>הרשמה</h2>

      <form onSubmit={handleSubmit} className={classes.loginForm}>
        <div className={classes.formGroup}>
          <label className={classes.label}>שם משתמש</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={classes.input}
            placeholder="שם משתמש"
            required
          />
        </div>

        <div className={classes.formGroup}>
          <label className={classes.label}>שם מלא</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className={classes.input}
            placeholder="שם מלא"
            required
          />
        </div>

        <div className={classes.formGroup}>
          <label className={classes.label}>אימייל</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={classes.input}
            placeholder="אימייל"
            required
          />
        </div>

        <div className={classes.formGroup}>
          <label className={classes.label}>מספר טלפון</label>
          <input
            type="tel"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className={classes.input}
            placeholder="מספר טלפון"
            required
          />
        </div>

        <div className={classes.formGroup}>
          <label className={classes.label}>סיסמה</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={classes.input}
            placeholder="סיסמה"
            required
          />
        </div>

        <div className={classes.formGroup}>
          <label className={classes.label}>אימות סיסמה</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={classes.input}
            placeholder="אימות סיסמה"
            required
          />
        </div>

        {error && <p className={classes.errorText}>{error}</p>}

        <button type="submit" className={classes.button}>
          הרשמה
        </button>
      </form>
    </div>
  );
}

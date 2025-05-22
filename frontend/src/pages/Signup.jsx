import { useState } from "react";
import classes from "../styles/login.module.css";
import { API_URL } from '../config';

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
    phone_number: "",
    birth_date: "",
    role: "user",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    const requiredFields = ['username', 'password', 'full_name', 'email', 'phone_number', 'birth_date'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      console.log('Sending request to:', `${API_URL}/users/register`);
      console.log('With data:', formData);

      const res = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          birth_date: formData.birth_date // Send date in YYYY-MM-DD format
        }),
      });

      const data = await res.json();
      console.log('Response:', data);

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      alert('נרשמת בהצלחה');
      window.location.href = '/login';
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    }
  };

  return (
    <div className={classes.container}>
      <h2>הרשמה</h2>
      {error && <p className={classes.error}>{error}</p>}
      <form onSubmit={handleSubmit} className={classes.form}>
        <input
          name="full_name"
          placeholder="שם מלא"
          onChange={handleChange}
          required
          minLength="2"
          value={formData.full_name}
        />
        <input
          name="username"
          placeholder="שם משתמש"
          onChange={handleChange}
          required
          minLength="3"
          value={formData.username}
        />
        <input
          name="email"
          type="email"
          placeholder="אימייל"
          onChange={handleChange}
          required
          value={formData.email}
        />
        <input
          name="phone_number"
          placeholder="טלפון"
          onChange={handleChange}
          required
          pattern="[0-9]{10}"
          title="Please enter a valid 10-digit phone number"
          value={formData.phone_number}
        />
        <input
          name="birth_date"
          type="date"
          onChange={handleChange}
          required
          value={formData.birth_date}
        />
        <input
          name="password"
          type="password"
          placeholder="סיסמה"
          onChange={handleChange}
          required
          minLength="6"
          value={formData.password}
        />
        <select
          name="role"
          onChange={handleChange}
          value={formData.role}
        >
          <option value="user">משתמש</option>
          <option value="admin">מנהל</option>
        </select>
        <button type="submit" className={classes.submitButton}>הרשם</button>
      </form>
    </div>
  );
}

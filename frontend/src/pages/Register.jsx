import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import '../styles/Register.css';

const API_URL = 'http://localhost:4000/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    phone_number: '',
    birth_date: null,
    full_name: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate form data
    if (!formData.username || !formData.password || !formData.email || 
        !formData.phone_number || !formData.full_name) {
      setError('All fields are required');
      return;
    }

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }



      // Format the data
      const formattedData = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        full_name: formData.full_name,
        phone_number: formData.phone_number
      };

      console.log('Sending registration data:', formattedData);

      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData)
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setError(error.message || 'Registration failed');
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2 className="register-title">Register</h2>
        {error && <div className="register-error">{error}</div>}
        {success && <div className="register-success">Registration successful! Redirecting to login...</div>}
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="input-group">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="register-input"
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="register-input"
              required
            />
          </div>

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="register-input"
              required
            />
          </div>

          <div className="input-group">
            <input
              type="tel"
              name="phone_number"
              placeholder="Phone Number"
              value={formData.phone_number}
              onChange={handleChange}
              className="register-input"
              required
            />
          </div>

          <div className="input-group">
            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={formData.full_name}
              onChange={handleChange}
              className="register-input"
              required
            />
          </div>

          <div className="input-group">
            <input
              type="date"
              className="register-input"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="register-button">
            Register
          </button>
        </form>

        <div className="register-links">
          <Link to="/login" className="register-link">
            Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

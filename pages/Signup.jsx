import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    bodyType: "hourglass",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/users/signup",
        formData
      );
      localStorage.setItem("token", response.data.token);
      navigate("/shop");
    } catch (error) {
      console.error("Error signing up:", error);
      alert("Error signing up. Please try again.");
    }
  };

  return (
    <div className="signup-container">
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit} className="signup-form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
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
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="bodyType">Body Type:</label>
          <select
            id="bodyType"
            name="bodyType"
            value={formData.bodyType}
            onChange={handleChange}
          >
            <option value="hourglass">Hourglass</option>
            <option value="pear">Pear</option>
            <option value="apple">Apple</option>
            <option value="rectangle">Rectangle</option>
          </select>
        </div>

        <button type="submit" className="signup-btn">
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default Signup;

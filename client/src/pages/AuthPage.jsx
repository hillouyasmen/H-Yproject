import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../utils/api';
import '../styles/AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: ''
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Handle login
        await login({
          username: formData.username,
          password: formData.password
        });
        navigate('/profile');
      } else {
        // Handle registration
        await register({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          fullName: formData.fullName
        });
        
        // Switch to login form after successful registration
        setIsLogin(true);
        setError('Registration successful! Please log in.');
        
        // Clear form
        setFormData({
          username: '',
          password: '',
          email: '',
          fullName: ''
        });
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!forgotPasswordEmail) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      const response = await fetchApi('/users/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });
      
      if (response.success) {
        setError('Password reset instructions have been sent to your email.');
        setShowForgotPassword(false);
      } else {
        throw new Error(response.message || 'Failed to send reset instructions');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError(error.message || 'Failed to process your request. Please try again.');
    }
  };

  if (showForgotPassword) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h2>Reset Password</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleForgotPassword} className="auth-form">
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Login
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!forgotPasswordEmail}
              >
                Send Reset Link
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isLogin ? 'Login' : 'Create Account'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
            </>
          )}
          
          <div className="form-group">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              className="form-input"
            />
            {isLogin && (
              <div className="forgot-password">
                <button 
                  type="button" 
                  className="text-link"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
            </button>
            {!isLogin && (
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setIsLogin(true)}
              >
                Back to Login
              </button>
            )}
          </div>
        </form>
        
        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button 
              type="button" 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="toggle-auth"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../utils/api';
import '../styles/auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetchApi('/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.success) {
        setEmailSent(true);
        setMessage('If an account with that email exists, a password reset link has been sent.');
        
        // In development, show the reset link for testing
        if (process.env.NODE_ENV === 'development' && response.resetToken) {
          const resetLink = `${window.location.origin}/reset-password/${response.resetToken}`;
          console.log('Reset link (development only):', resetLink);
          setMessage(prev => `${prev} \n\nReset Link (dev only): ${resetLink}`);
        }
      } else {
        setError(response.message || 'Failed to send reset link. Please try again.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Reset Your Password</h2>
        
        {message && <div className="auth-message success">{message}</div>}
        {error && <div className="auth-message error">{error}</div>}
        
        {!emailSent ? (
          <>
            <p>Enter your email address and we'll send you a link to reset your password.</p>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="auth-button"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="auth-success">
            <p>We've sent an email to <strong>{email}</strong> with instructions to reset your password.</p>
            <p>Didn't receive the email? Check your spam folder or <button 
              className="text-button" 
              onClick={() => setEmailSent(false)}
            >
              try again
            </button>.</p>
          </div>
        )}
        
        <div className="auth-links">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

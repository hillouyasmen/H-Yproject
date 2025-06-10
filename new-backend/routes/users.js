const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

// In-memory storage for reset codes (in production, use Redis or similar)
const resetCodes = new Map();

// Helper function to store reset code
const saveCode = (email, code) => {
  resetCodes.set(email, {
    code,
    timestamp: Date.now()
  });
};

// Helper function to verify reset code
const verifyCode = (email, code) => {
  const storedData = resetCodes.get(email);
  if (!storedData) return false;
  
  // Check if code is expired (10 minutes)
  if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
    resetCodes.delete(email);
    return false;
  }
  
  if (storedData.code !== code) return false;
  
  // Code is valid - remove it so it can't be reused
  resetCodes.delete(email);
  return true;
};

// Username validation function
const validateUsername = (username) => {
  return username && username.length >= 2 && /^[a-zA-Z]+$/.test(username);
};

// Registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, full_name, phone_number } = req.body;

    // Validate required fields
    if (!username || !password || !email || !full_name || !phone_number) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate username format
    if (!validateUsername(username)) {
      return res.status(400).json({ message: 'Username must contain only letters and be at least 2 characters long' });
    }

    // Check if username is taken
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length > 0) {
      return res.status(400).json({ message: 'Username taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (username, password, email, full_name, phone_number) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, email, full_name, phone_number]
    );

    res.json({
      success: true,
      user: {
        id: result.insertId,
        username,
        email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if user exists
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, users[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: users[0].user_id, username: users[0].username },
      'your-secret-key', // TODO: Move to environment variable
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: users[0].user_id,
        username: users[0].username,
        email: users[0].email,
        role: users[0].role || 'user'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

/**
 * @route GET /api/users/me
 * @desc Get user profile
 * @access Private
 */
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id; // This comes from the auth middleware

    const [user] = await pool.query(
      'SELECT user_id, username, email, full_name, phone_number, role FROM users WHERE user_id = ?',
      [userId]
    );

    if (!user[0]) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user details endpoint
router.put('/update', async (req, res) => {
  try {
    const userId = req.user.id; // This comes from the auth middleware
    const { email, full_name, phone_number } = req.body;

    // Validate required fields
    if (!email || !full_name || !phone_number) {
      return res.status(400).json({ message: 'Email, full name, and phone number are required' });
    }

    // Update user details
    await pool.query(
      'UPDATE users SET email = ?, full_name = ?, phone_number = ? WHERE user_id = ?',
      [email, full_name, phone_number, userId]
    );

    // Get updated user details
    const [updatedUser] = await pool.query(
      'SELECT user_id, username, email, full_name, phone_number, role FROM users WHERE user_id = ?',
      [userId]
    );

    if (!updatedUser[0]) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser[0]
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Request password reset (send verification code)
const { sendResetEmail } = require('../utils/email');

router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'No user found with this email' });
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the code (we're using memory storage for simplicity)
    saveCode(email, code);

    // Send the reset email
    await sendResetEmail(email, code);

    res.json({ message: 'Verification code sent successfully' });
  } catch (error) {
    console.error('Reset request error:', error);
    res.status(500).json({ message: 'Error processing reset request' });
  }
});

// Reset password with verification code
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Verify the code
    if (!verifyCode(email, code)) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await pool.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

module.exports = router;
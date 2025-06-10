// User routes
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Validate username and password
const validateCredentials = (username, password) => {
  // Username must be at least 2 letters
  if (!/^[a-zA-Z]{2,}$/.test(username)) {
    return 'Username must contain at least 2 letters';
  }

  // Password must be 3-8 chars, at least 1 letter and 1 number
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{3,8}$/.test(password)) {
    return 'Password must be 3-8 characters with at least 1 letter and 1 number';
  }

  return null;
};

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Validate format
    const validationError = validateCredentials(username, password);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // Check if user exists
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = users[0];
    res.json({ 
      message: 'Login successful', 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Validate format
    const validationError = validateCredentials(username, password);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // Check if username already exists
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Insert new user
    await db.query(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, password, email]
    );

    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
// Reset password route
router.post('/reset-password', async (req, res) => {
  try {
    const { email, phone_number } = req.body;

    if (!email || !phone_number) {
      return res.status(400).json({ message: 'Email and phone number are required' });
    }

    // Check if user exists with given email and phone
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? AND phone_number = ?',
      [email, phone_number]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'No user found with these credentials' });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8);

    // Update user's password
    await db.query(
      'UPDATE users SET password = ? WHERE email = ? AND phone_number = ?',
      [tempPassword, email, phone_number]
    );

    // In a real application, you would send this password via email
    // For now, we'll just return it in the response
    res.json({ 
      message: 'Password reset successful', 
      tempPassword: tempPassword 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const [users] = await db.query(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { email } = req.body;

    await db.query(
      'UPDATE users SET email = ? WHERE id = ?',
      [email, userId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

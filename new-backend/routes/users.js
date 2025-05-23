const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, full_name, phone_number } = req.body;

    if (!username || !password || !email || !full_name || !phone_number) {
      return res.status(400).json({ message: 'Fill all fields' });
    }

    // Check username
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length > 0) {
      return res.status(400).json({ message: 'Username taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
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
    res.status(500).json({ message: 'Error registering' });
  }
});

// Get user profile
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id; // This comes from the auth middleware

    const [user] = await pool.query(
      'SELECT id, username, email, full_name, phone_number, role FROM users WHERE id = ?',
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

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Enter username and password' });
    }

    // Get user
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Wrong username or password' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Wrong username or password' });
    }

    res.json({
      success: true,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

module.exports = router;

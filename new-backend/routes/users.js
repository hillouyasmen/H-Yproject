const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Op } = require('sequelize');
const { auth, adminAuth } = require('../middleware/auth');

// Register user
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    
    const { username, password, email, phone_number, birth_date, full_name, role } = req.body;
    
    if (!username || !password || !email || !phone_number || !birth_date || !full_name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Format birth_date to YYYY-MM-DD
    const formattedDate = new Date(birth_date).toISOString().split('T')[0];

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { 
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Create new user
    const newUser = await User.create({
      username,
      password, // Password will be hashed by the model hooks
      email,
      phone_number,
      birth_date: formattedDate,
      full_name,
      role: role || 'user'
    });

    // Create token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    });
  } catch (error) {
    console.error('Error in user registration:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user with password
    const user = await User.scope('withPassword').findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    });
  } catch (error) {
    console.error('Error in user login:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { full_name, email, phone_number, birth_date } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user
    await user.update({
      full_name,
      email,
      phone_number,
      birth_date
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        birth_date: user.birth_date
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Admin: Get all users
router.get('/', adminAuth, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router;

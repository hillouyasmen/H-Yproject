const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { verifyToken } = require('../middleware/auth');

// Generate a secure reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Register
router.post('/register', async (req, res) => {
  const { username, password, email, fullName } = req.body;
  if (!username || !password || !email || !fullName) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  
  try {
    // Check if user exists by username or email
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?', 
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Username or email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user with default role 'user'
    await db.query(
      'INSERT INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, email, fullName, 'user']
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Registration successful' 
    });
    
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    // Find user by username
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(200).json({ 
        success: false, 
        message: 'Invalid username or password',
        data: null,
        error: 'Invalid credentials'
      });
    }

    // Create token with user role
    const token = jwt.sign(
      { 
        userId: user.id,
        role: user.role || 'user'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    // Prepare user data for response
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name || user.username,
      role: user.role || 'user'
    };
    
    // Store token in httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    // Format the response to match frontend's expectations
    const responseData = {
      success: true,
      message: 'Login successful',
      token: token,
      user: userData,
      // Include all user data at root level for backward compatibility
      ...userData
    };
    
    // Send the response
    res.json(responseData);
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      data: null,
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }  
});

// Simple Password Reset
// This is a simplified version without email verification
// In production, you should implement proper email verification
router.post('/reset-password', async (req, res) => {
  const { username, newPassword, confirmPassword } = req.body;
  
  // Basic validation
  if (!username || !newPassword || !confirmPassword) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username, new password, and confirm password are required' 
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ 
      success: false, 
      message: 'Passwords do not match' 
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 8 characters long' 
    });
  }

  try {
    // Check if user exists
    const [users] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const userId = users[0].id;
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password in the database
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    
    res.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error resetting password',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Forgot Password - Generate and store reset token
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }

  try {
    // Check if user exists with this email
    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      // For security, don't reveal if email exists or not
      return res.json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent' 
      });
    }

    const userId = users[0].id;
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // Store token in database
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, resetToken, expiresAt]
    );

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, resetToken);
      
      // Don't include the token in the response in production
      const response = { 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent'
      };
      
      // Only include token in development for testing
      if (process.env.NODE_ENV === 'development') {
        response.resetToken = resetToken;
      }
      
      res.json(response);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Still return success to avoid revealing if the email exists
      res.json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }
    
  } catch (err) {
    console.error('Error in forgot password:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing forgot password request' 
    });
  }
});

// Reset Password with token
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;
  
  if (!newPassword || !confirmPassword) {
    return res.status(400).json({ 
      success: false, 
      message: 'New password and confirmation are required' 
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ 
      success: false, 
      message: 'Passwords do not match' 
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 8 characters long' 
    });
  }

  try {
    // Find valid token
    const [tokens] = await db.query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > NOW()',
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    const tokenData = tokens[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used in a transaction
    await db.query('START TRANSACTION');
    
    try {
      await db.query('UPDATE users SET password = ? WHERE id = ?', 
        [hashedPassword, tokenData.user_id]);
      
      await db.query('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', 
        [tokenData.id]);
      
      await db.query('COMMIT');
      
      res.json({ 
        success: true, 
        message: 'Password has been reset successfully' 
      });
      
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
    
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error resetting password' 
    });
  }
});

// Get all users (admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const [users] = await db.query('SELECT id, username, email, full_name, role, created_at FROM users');
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update user (protected route)
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { username, email, full_name, role } = req.body;

  try {
    // Only allow admins to update other users
    if (req.user.role !== 'admin' && req.user.id.toString() !== id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this user' 
      });
    }

    // Prevent non-admins from changing roles
    const updateFields = [username, email, full_name];
    let query = 'UPDATE users SET username = ?, email = ?, full_name = ?';
    
    // Only include role in update if user is admin
    if (req.user.role === 'admin') {
      query += ', role = ?';
      updateFields.push(role);
    }
    
    query += ' WHERE id = ?';
    updateFields.push(id);

    const [result] = await db.query(query, updateFields);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'User updated successfully' 
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete user (protected route)
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Only allow admins to delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete users' 
      });
    }

    // Prevent self-deletion
    if (req.user.id.toString() === id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

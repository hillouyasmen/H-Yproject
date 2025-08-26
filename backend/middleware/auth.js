<<<<<<< HEAD
// backend/middleware/auth.js
import jwt from "jsonwebtoken";
const { JWT_SECRET = "devsecret" } = process.env;

export function attachUser(req, _res, next) {
  try {
    const h = req.headers.authorization || "";
    const m = h.match(/^Bearer\s+(.+)$/i);
    if (m) {
      const decoded = jwt.verify(m[1], JWT_SECRET);
      req.user = {
        id: decoded.sub,
        role: decoded.role,
        username: decoded.username,
      };
    }
  } catch {}
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
}
=======
const jwt = require('jsonwebtoken');
const db = require('../db');

// Middleware to verify token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user details from database
    const [users] = await db.query('SELECT id, username, email, role FROM users WHERE id = ?', [decoded.userId]);
    const user = users[0];
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Attach user to request object
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user'
    };
    
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

module.exports = {
  verifyToken
};
>>>>>>> 96d5d4fa470c5e3711e74096bc067efa4f6df75d

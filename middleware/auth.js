const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'gfg_cmp_super_secret_jwt_key_2026';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user to req
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      // In dev fallback mode if user ID is mock
      req.user = { id: decoded.id, username: decoded.username || 'admin', role: decoded.role || 'Super Admin' };
    } else {
      req.user = user;
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token', error: err.message });
  }
};

module.exports = {
  authMiddleware,
  JWT_SECRET
};

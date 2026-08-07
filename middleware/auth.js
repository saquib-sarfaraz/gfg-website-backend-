const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AdminAccess = require('../models/AdminAccess');

const JWT_SECRET = process.env.JWT_SECRET || 'gfg_cmp_super_secret_jwt_key_2026';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token missing or invalid.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch User identity
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User identity not found.' });
    }
    
    req.user = user;

    // Check if user has Administrative Authority (AdminAccess)
    const adminAccess = await AdminAccess.findOne({ userRef: user._id });
    if (adminAccess && adminAccess.status === 'Active') {
      req.adminAccess = adminAccess;
    } else {
      req.adminAccess = null;
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.', error: err.message });
  }
};

// Middleware: Enforce active AdminAccess
const adminOnly = (req, res, next) => {
  if (!req.adminAccess || req.adminAccess.status !== 'Active') {
    return res.status(403).json({ success: false, message: 'Administrative access required.' });
  }
  next();
};

// Middleware: Enforce specific permission OR ROOT_SUPER_ADMIN role
const requirePermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.adminAccess || req.adminAccess.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Administrative access required.' });
    }

    const isRoot = req.adminAccess.adminRole === 'ROOT_SUPER_ADMIN';
    const hasPermission = req.adminAccess.permissions && req.adminAccess.permissions.includes(permissionName);

    if (!isRoot && !hasPermission) {
      return res.status(403).json({ success: false, message: `Permission '${permissionName}' required for this administrative action.` });
    }

    next();
  };
};

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        const adminAccess = await AdminAccess.findOne({ userRef: user._id });
        req.adminAccess = (adminAccess && adminAccess.status === 'Active') ? adminAccess : null;
      }
    }
  } catch (_) {
    // Ignore invalid optional tokens
  }
  next();
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminOnly,
  requirePermission,
  JWT_SECRET
};

const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verifies JWT and attaches req.user
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided. Please login.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact your admin.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// Restrict route to specific roles
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
  }
  next();
};

module.exports = { verifyToken, requireRole };

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { withDefaults } = require('../constants/permissions');

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

// Restrict route to a specific module/action permission. Admins always pass.
// Employees pass only if their stored permissions grant that exact action.
const requirePermission = (moduleKey, action) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No token provided. Please login.' });
  }
  // Project Managers are scoped by team (see middleware/scope.js), not by the
  // per-action permission toggles that apply to plain employees.
  if (req.user.role === 'admin' || req.user.role === 'project_manager') return next();

  const perms = withDefaults(req.user.permissions);
  if (perms[moduleKey] && perms[moduleKey][action]) return next();

  return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
};

module.exports = { verifyToken, requireRole, requirePermission };

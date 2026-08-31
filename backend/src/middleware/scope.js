const { User } = require('../models');

// For a Project Manager, attaches the list of user ids they're allowed to see
// data for: themselves plus every employee assigned to them (manager_id === their id).
// Admin and employee requests pass through untouched — their access logic doesn't
// need this (admin sees everything, employee is scoped to their own id already).
async function attachManagedScope(req, res, next) {
  try {
    if (req.user && req.user.role === 'project_manager') {
      const managed = await User.findAll({ where: { manager_id: req.user.id }, attributes: ['id'] });
      req.user.managedIds = [req.user.id, ...managed.map((m) => m.id)];
    }
    next();
  } catch (err) {
    console.error('Attach managed scope error:', err);
    return res.status(500).json({ success: false, message: 'Server error while resolving access scope.' });
  }
}

// True if `ownerId` (a generated_by_id / submitted_by_id / assigned_to_id, etc.)
// falls within the requesting user's access scope.
function inScope(ownerId, reqUser) {
  if (!ownerId) return false;
  if (reqUser.role === 'admin') return true;
  if (reqUser.role === 'project_manager') return (reqUser.managedIds || []).includes(ownerId);
  return ownerId === reqUser.id;
}

module.exports = { attachManagedScope, inScope };

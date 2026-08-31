const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Invoice } = require('../models');
const { DEFAULT_EMPLOYEE_PERMISSIONS, PERMISSION_SCHEMA, withDefaults } = require('../constants/permissions');

const MANAGEABLE_ROLES = ['employee', 'project_manager'];

const sanitize = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  phone: u.phone,
  branch: u.branch,
  status: u.status,
  manager_id: u.manager_id,
  createdAt: u.createdAt,
  // Project Managers aren't gated by the permission toggles (they're scoped by
  // team instead — see middleware/scope.js), so this is only meaningful for employees.
  permissions: u.role === 'employee' ? withDefaults(u.permissions) : null,
});

// POST /api/employees  (admin only) - create a new employee or project manager
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, phone, branch, role, manager_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    const finalRole = role === 'project_manager' ? 'project_manager' : 'employee';

    let finalManagerId = null;
    if (finalRole === 'employee' && manager_id) {
      const manager = await User.findOne({ where: { id: manager_id, role: 'project_manager' } });
      if (!manager) {
        return res.status(400).json({ success: false, message: 'Selected project manager not found.' });
      }
      finalManagerId = manager.id;
    }

    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const employee = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashed,
      role: finalRole,
      phone,
      branch,
      status: 'active',
      created_by: req.user.id,
      manager_id: finalManagerId,
      permissions: finalRole === 'employee' ? DEFAULT_EMPLOYEE_PERMISSIONS : null,
    });

    return res.status(201).json({ success: true, message: `${finalRole === 'project_manager' ? 'Project manager' : 'Employee'} created successfully.`, employee: sanitize(employee) });
  } catch (err) {
    console.error('Create employee error:', err);
    return res.status(500).json({ success: false, message: 'Server error while creating employee.' });
  }
};

// GET /api/employees
// admin: sees every employee + project manager.
// project manager: sees only the employees assigned to them.
// employee (with crm.updateWorkflow permission): sees everyone, for assignment dropdowns — unchanged legacy behavior.
exports.listEmployees = async (req, res) => {
  try {
    const where = req.user.role === 'project_manager'
      ? { role: 'employee', manager_id: req.user.id }
      : { role: { [Op.in]: MANAGEABLE_ROLES } };
    const employees = await User.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, employees: employees.map(sanitize) });
  } catch (err) {
    console.error('List employees error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching employees.' });
  }
};

// PUT /api/employees/:id (admin only) - update employee/PM details, role, manager, or status
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, branch, status, password, role, manager_id } = req.body;

    const employee = await User.findOne({ where: { id, role: { [Op.in]: MANAGEABLE_ROLES } } });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    if (name) employee.name = name;
    if (phone !== undefined) employee.phone = phone;
    if (branch !== undefined) employee.branch = branch;
    if (status && ['active', 'inactive'].includes(status)) employee.status = status;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      }
      employee.password = await bcrypt.hash(password, 10);
    }

    if (role && MANAGEABLE_ROLES.includes(role) && role !== employee.role) {
      employee.role = role;
      if (role === 'project_manager') {
        // A project manager doesn't report to another project manager in this model.
        employee.manager_id = null;
        employee.permissions = null;
      } else {
        employee.permissions = DEFAULT_EMPLOYEE_PERMISSIONS;
      }
    }

    if (manager_id !== undefined && employee.role === 'employee') {
      if (!manager_id) {
        employee.manager_id = null;
      } else {
        const manager = await User.findOne({ where: { id: manager_id, role: 'project_manager' } });
        if (!manager) {
          return res.status(400).json({ success: false, message: 'Selected project manager not found.' });
        }
        employee.manager_id = manager.id;
      }
    }

    await employee.save();
    return res.json({ success: true, message: 'Employee updated successfully.', employee: sanitize(employee) });
  } catch (err) {
    console.error('Update employee error:', err);
    return res.status(500).json({ success: false, message: 'Server error while updating employee.' });
  }
};

// GET /api/employees/:id/permissions (admin only)
exports.getEmployeePermissions = async (req, res) => {
  try {
    const employee = await User.findOne({ where: { id: req.params.id, role: 'employee' } });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }
    return res.json({ success: true, schema: PERMISSION_SCHEMA, permissions: withDefaults(employee.permissions) });
  } catch (err) {
    console.error('Get employee permissions error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching permissions.' });
  }
};

// PUT /api/employees/:id/permissions (admin only)
exports.updateEmployeePermissions = async (req, res) => {
  try {
    const employee = await User.findOne({ where: { id: req.params.id, role: 'employee' } });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const incoming = req.body.permissions || {};
    // Whitelist against the known schema only — never trust arbitrary keys from the client.
    const next = {};
    for (const moduleKey of Object.keys(PERMISSION_SCHEMA)) {
      next[moduleKey] = {};
      for (const actionKey of Object.keys(PERMISSION_SCHEMA[moduleKey].actions)) {
        const current = withDefaults(employee.permissions)[moduleKey][actionKey];
        next[moduleKey][actionKey] = incoming[moduleKey] && typeof incoming[moduleKey][actionKey] === 'boolean'
          ? incoming[moduleKey][actionKey]
          : current;
      }
    }

    employee.permissions = next;
    await employee.save();
    return res.json({ success: true, message: 'Permissions updated successfully.', permissions: next });
  } catch (err) {
    console.error('Update employee permissions error:', err);
    return res.status(500).json({ success: false, message: 'Server error while updating permissions.' });
  }
};

// DELETE /api/employees/:id (admin only)
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findOne({ where: { id, role: { [Op.in]: MANAGEABLE_ROLES } } });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const invoiceCount = await Invoice.count({ where: { generated_by_id: id } });
    if (invoiceCount > 0) {
      // Preserve invoice history integrity - deactivate instead of hard delete
      employee.status = 'inactive';
      await employee.save();
      return res.json({ success: true, message: 'This account has existing invoices, so it was deactivated instead of deleted.' });
    }

    await employee.destroy();
    return res.json({ success: true, message: 'Removed successfully.' });
  } catch (err) {
    console.error('Delete employee error:', err);
    return res.status(500).json({ success: false, message: 'Server error while removing the account.' });
  }
};

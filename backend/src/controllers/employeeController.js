const bcrypt = require('bcryptjs');
const { User, Invoice } = require('../models');

const sanitize = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  phone: u.phone,
  branch: u.branch,
  status: u.status,
  createdAt: u.createdAt,
});

// POST /api/employees  (admin only) - create a new employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, phone, branch } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
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
      role: 'employee',
      phone,
      branch,
      status: 'active',
      created_by: req.user.id,
    });

    return res.status(201).json({ success: true, message: 'Employee created successfully.', employee: sanitize(employee) });
  } catch (err) {
    console.error('Create employee error:', err);
    return res.status(500).json({ success: false, message: 'Server error while creating employee.' });
  }
};

// GET /api/employees (admin only) - list all employees
exports.listEmployees = async (req, res) => {
  try {
    const employees = await User.findAll({
      where: { role: 'employee' },
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, employees: employees.map(sanitize) });
  } catch (err) {
    console.error('List employees error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching employees.' });
  }
};

// PUT /api/employees/:id (admin only) - update employee details / status
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, branch, status, password } = req.body;

    const employee = await User.findOne({ where: { id, role: 'employee' } });
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

    await employee.save();
    return res.json({ success: true, message: 'Employee updated successfully.', employee: sanitize(employee) });
  } catch (err) {
    console.error('Update employee error:', err);
    return res.status(500).json({ success: false, message: 'Server error while updating employee.' });
  }
};

// DELETE /api/employees/:id (admin only)
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findOne({ where: { id, role: 'employee' } });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const invoiceCount = await Invoice.count({ where: { generated_by_id: id } });
    if (invoiceCount > 0) {
      // Preserve invoice history integrity - deactivate instead of hard delete
      employee.status = 'inactive';
      await employee.save();
      return res.json({ success: true, message: 'Employee has existing invoices, so the account was deactivated instead of deleted.' });
    }

    await employee.destroy();
    return res.json({ success: true, message: 'Employee deleted successfully.' });
  } catch (err) {
    console.error('Delete employee error:', err);
    return res.status(500).json({ success: false, message: 'Server error while deleting employee.' });
  }
};

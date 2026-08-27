const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');
const {
  createEmployee, listEmployees, updateEmployee, deleteEmployee,
  getEmployeePermissions, updateEmployeePermissions,
} = require('../controllers/employeeController');

router.use(verifyToken);

router.post('/', requireRole('admin'), createEmployee);
// Listing is also allowed for an employee granted CRM workflow rights, since
// assigning/closing a lead requires picking another employee from this list.
router.get('/', requirePermission('crm', 'updateWorkflow'), listEmployees);
router.put('/:id', requireRole('admin'), updateEmployee);
router.get('/:id/permissions', requireRole('admin'), getEmployeePermissions);
router.put('/:id/permissions', requireRole('admin'), updateEmployeePermissions);
router.delete('/:id', requireRole('admin'), deleteEmployee);

module.exports = router;

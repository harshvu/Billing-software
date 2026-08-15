const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  createEmployee, listEmployees, updateEmployee, deleteEmployee,
} = require('../controllers/employeeController');

router.use(verifyToken, requireRole('admin'));

router.post('/', createEmployee);
router.get('/', listEmployees);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;

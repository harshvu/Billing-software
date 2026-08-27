const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');
const { getSummary } = require('../controllers/reportController');

router.use(verifyToken, requireRole('admin', 'employee'));

router.get('/summary', requirePermission('reports', 'view'), getSummary);

module.exports = router;

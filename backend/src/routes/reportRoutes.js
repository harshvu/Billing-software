const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getSummary } = require('../controllers/reportController');

router.use(verifyToken, requireRole('admin', 'employee'));

router.get('/summary', getSummary);

module.exports = router;

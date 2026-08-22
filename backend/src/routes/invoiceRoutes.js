const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  createInvoice, listInvoices, getInvoice, downloadInvoicePDF, convertToTaxInvoice, generateSimpleInvoice, deleteInvoice,
} = require('../controllers/invoiceController');

router.use(verifyToken, requireRole('admin', 'employee'));

router.post('/', createInvoice);
router.get('/', listInvoices);
router.get('/:id', getInvoice);
router.get('/:id/pdf', downloadInvoicePDF);
router.put('/:id/convert-to-tax', requireRole('admin'), convertToTaxInvoice);
router.post('/:id/generate-simple', requireRole('admin'), generateSimpleInvoice);
router.delete('/:id', requireRole('admin'), deleteInvoice);

module.exports = router;

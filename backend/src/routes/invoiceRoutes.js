const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');
const { attachManagedScope } = require('../middleware/scope');
const {
  createInvoice, listInvoices, getInvoice, downloadInvoicePDF, convertToTaxInvoice, generateSimpleInvoice, deleteInvoice,
} = require('../controllers/invoiceController');

router.use(verifyToken, requireRole('admin', 'employee', 'project_manager'), attachManagedScope);

router.post('/', requirePermission('invoices', 'create'), createInvoice);
router.get('/', requirePermission('invoices', 'view'), listInvoices);
router.get('/:id', requirePermission('invoices', 'view'), getInvoice);
router.get('/:id/pdf', requirePermission('invoices', 'download'), downloadInvoicePDF);
router.put('/:id/convert-to-tax', requirePermission('invoices', 'convertToTax'), convertToTaxInvoice);
router.post('/:id/generate-simple', requirePermission('invoices', 'generateInvoice'), generateSimpleInvoice);
router.delete('/:id', requirePermission('invoices', 'delete'), deleteInvoice);

module.exports = router;

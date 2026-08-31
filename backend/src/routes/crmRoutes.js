const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requirePermission } = require('../middleware/auth');
const { attachManagedScope } = require('../middleware/scope');
const { uploadPaymentProof, uploadDocument } = require('../middleware/upload');
const {
  createCrmEntry, listCrmEntries, getCrmEntry, updateCrmEntry,
  updateStatus, updateRemark, uploadPaymentProof: uploadPaymentProofHandler,
  uploadDocument: uploadDocumentHandler, deleteCrmEntry,
} = require('../controllers/crmController');

router.use(verifyToken, requireRole('admin', 'employee', 'project_manager'), attachManagedScope);

router.post('/', requirePermission('crm', 'create'), createCrmEntry);
router.get('/', requirePermission('crm', 'view'), listCrmEntries);
router.get('/:id', requirePermission('crm', 'view'), getCrmEntry);
router.put('/:id', updateCrmEntry);
router.put('/:id/status', requirePermission('crm', 'updateWorkflow'), updateStatus);
router.put('/:id/remark', updateRemark);
router.post('/:id/payment-proof', requirePermission('crm', 'uploadPaymentProof'), uploadPaymentProof.single('file'), uploadPaymentProofHandler);
router.post('/:id/documents', requirePermission('crm', 'uploadDocument'), uploadDocument.single('file'), uploadDocumentHandler);
router.delete('/:id', requirePermission('crm', 'delete'), deleteCrmEntry);

module.exports = router;

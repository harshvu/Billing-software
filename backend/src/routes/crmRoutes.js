const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { uploadPaymentProof, uploadDocument } = require('../middleware/upload');
const {
  createCrmEntry, listCrmEntries, getCrmEntry, updateCrmEntry,
  updateStatus, updateRemark, uploadPaymentProof: uploadPaymentProofHandler,
  uploadDocument: uploadDocumentHandler, deleteCrmEntry,
} = require('../controllers/crmController');

router.use(verifyToken, requireRole('admin', 'employee'));

router.post('/', createCrmEntry);
router.get('/', listCrmEntries);
router.get('/:id', getCrmEntry);
router.put('/:id', updateCrmEntry);
router.put('/:id/status', requireRole('admin'), updateStatus);
router.put('/:id/remark', updateRemark);
router.post('/:id/payment-proof', uploadPaymentProof.single('file'), uploadPaymentProofHandler);
router.post('/:id/documents', uploadDocument.single('file'), uploadDocumentHandler);
router.delete('/:id', requireRole('admin'), deleteCrmEntry);

module.exports = router;

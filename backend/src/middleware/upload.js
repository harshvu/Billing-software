const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads', 'crm');
const PAYMENT_PROOF_DIR = path.join(UPLOAD_ROOT, 'payment-proofs');
const DOCUMENT_DIR = path.join(UPLOAD_ROOT, 'documents');

[PAYMENT_PROOF_DIR, DOCUMENT_DIR].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function randomFilename(originalName) {
  const ext = path.extname(originalName).slice(0, 10);
  return `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`;
}

function makeUploader(destDir) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, destDir),
    filename: (req, file, cb) => cb(null, randomFilename(file.originalname)),
  });

  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return cb(new Error('File type not allowed.'));
      }
      cb(null, true);
    },
  });
}

const uploadPaymentProof = makeUploader(PAYMENT_PROOF_DIR);
const uploadDocument = makeUploader(DOCUMENT_DIR);

module.exports = {
  uploadPaymentProof,
  uploadDocument,
  PAYMENT_PROOF_DIR,
  DOCUMENT_DIR,
  UPLOAD_ROOT: path.join(__dirname, '..', '..', 'uploads'),
};

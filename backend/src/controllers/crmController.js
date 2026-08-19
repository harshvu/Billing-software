const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, CrmEntry, CrmDocument, User } = require('../models');
const { CRM_STATUS_VALUES, CRM_STEP_VALUES, CRM_MODE_VALUES } = require('../constants/crm');

const BACKEND_ROOT = path.join(__dirname, '..', '..');

// Fields shared once across every service in a Combo Sale (company/payment/invoice identity).
const SHARED_FIELDS = [
  'company_name', 'cin_llp_no', 'company_email', 'company_mobile', 'contact_person', 'website',
  'company_pan', 'gst_no', 'industry', 'sector', 'city', 'state', 'complete_address',
  'user_remark',
  'payment_contact_no', 'payment_email', 'startup_contact_no', 'startup_email',
  'invoice_company_name', 'invoice_contact', 'invoice_email', 'invoice_pan', 'invoice_gst',
  'invoice_commission',
  'lead_closed_by', 'lead_closed_by_email',
];
// Fields that live per-service (each service in a combo gets its own copy).
const SERVICE_FIELDS = ['service', 'mode', 'percentage', 'total_quoted_amount', 'booking_mode', 'after_success_payment', 'deal_remark'];
const ENTRY_FIELDS = [...SHARED_FIELDS, ...SERVICE_FIELDS];

const SHARED_REQUIRED_FIELDS = [
  'company_name', 'company_email', 'company_mobile', 'contact_person', 'state', 'complete_address',
  'payment_contact_no', 'payment_email',
  'invoice_company_name', 'invoice_contact', 'invoice_email', 'invoice_pan',
];
const SERVICE_REQUIRED_FIELDS = ['service', 'mode', 'booking_mode'];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value) {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function computeGst(amount) {
  if (amount === '' || amount === null || amount === undefined) return null;
  const n = Number(amount);
  if (Number.isNaN(n)) return null;
  return +(n * 1.18).toFixed(2);
}

function applyPaymentParts(target, body, { requirePart1 } = {}) {
  const errors = [];
  for (const n of [1, 2, 3, 4]) {
    const amtField = `payment_part${n}_amount`;
    const dateField = `payment_part${n}_date`;
    const gstField = `payment_part${n}_gst`;
    if (body[amtField] !== undefined) {
      const raw = body[amtField];
      const amount = raw === '' || raw === null || raw === undefined ? null : Number(raw);
      if (amount !== null && Number.isNaN(amount)) errors.push(`Payment part ${n} amount is invalid.`);
      target[amtField] = amount;
      target[gstField] = computeGst(amount);
    }
    if (body[dateField] !== undefined) {
      const raw = body[dateField];
      if (!raw) {
        target[dateField] = null;
      } else if (!isValidDateString(raw)) {
        errors.push(`Payment part ${n} date is invalid.`);
      } else {
        target[dateField] = raw;
      }
    }
  }
  if (requirePart1) {
    const rawAmount = body.payment_part1_amount;
    const amount = rawAmount === '' || rawAmount === null || rawAmount === undefined ? 0 : Number(rawAmount);
    if (Number.isNaN(amount)) errors.push('Payment part 1 amount is invalid.');
    target.payment_part1_amount = Number.isNaN(amount) ? 0 : amount;
    target.payment_part1_gst = computeGst(target.payment_part1_amount);
    if (!isValidDateString(body.payment_part1_date)) errors.push('Payment part 1 date is invalid.');
    target.payment_part1_date = body.payment_part1_date;
  }
  return errors;
}

function computeTotals(entry) {
  const total = [1, 2, 3, 4].reduce((sum, n) => sum + (Number(entry[`payment_part${n}_gst`]) || 0), 0);
  return { total_received: +total.toFixed(2), total_amount: +total.toFixed(2) };
}

function canAccess(entry, user) {
  if (user.role === 'admin') return true;
  return entry.submitted_by_id === user.id || entry.assigned_to_id === user.id;
}

function isEditable(entry, user) {
  if (user.role === 'admin') return true;
  return entry.submitted_by_id === user.id && entry.status !== 'stage8';
}

function removeUploadedFile(file) {
  if (file) fs.unlink(file.path, () => {});
}

// POST /api/crm  (admin + employee)
// Normal submission: flat service fields on the body, one entry created.
// Combo Sale: body.combo_services is an array of 2+ service objects; company/payment/invoice
// fields are shared from the top-level body, and one separate CrmEntry is created per service,
// all tagged with the same combo_group_id so they show up linked together.
exports.createCrmEntry = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const body = req.body;

    for (const field of SHARED_REQUIRED_FIELDS) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        await t.rollback();
        return res.status(400).json({ success: false, message: `${field.replace(/_/g, ' ')} is required.` });
      }
    }

    const isCombo = Array.isArray(body.combo_services) && body.combo_services.length > 1;
    const serviceInputs = isCombo ? body.combo_services : [body];

    const preparedList = [];
    for (let i = 0; i < serviceInputs.length; i++) {
      const svc = serviceInputs[i] || {};
      for (const field of SERVICE_REQUIRED_FIELDS) {
        if (svc[field] === undefined || svc[field] === null || svc[field] === '') {
          await t.rollback();
          return res.status(400).json({ success: false, message: `Service ${i + 1}: ${field.replace(/_/g, ' ')} is required.` });
        }
      }
      if (!CRM_MODE_VALUES.includes(svc.mode)) {
        await t.rollback();
        return res.status(400).json({ success: false, message: `Service ${i + 1}: invalid mode.` });
      }

      const data = {};
      SHARED_FIELDS.forEach((f) => { if (body[f] !== undefined) data[f] = body[f]; });
      SERVICE_FIELDS.forEach((f) => { if (svc[f] !== undefined) data[f] = svc[f]; });
      const partErrors = applyPaymentParts(data, svc, { requirePart1: true });
      if (partErrors.length) {
        await t.rollback();
        return res.status(400).json({ success: false, message: `Service ${i + 1}: ${partErrors[0]}` });
      }
      preparedList.push(data);
    }

    const comboGroupId = isCombo ? `combo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}` : null;

    const created = [];
    for (const data of preparedList) {
      data.submitted_by_id = req.user.id;
      data.submitted_by_name = req.user.name;
      data.status = 'stage1';
      data.current_step = 'submitted';
      data.combo_group_id = comboGroupId;
      const entry = await CrmEntry.create(data, { transaction: t });
      created.push(entry);
    }

    await t.commit();

    return res.status(201).json({
      success: true,
      message: isCombo ? `Combo Sale created — ${created.length} linked CRM entries.` : 'CRM entry created successfully.',
      entry: created[0],
      entries: created,
    });
  } catch (err) {
    await t.rollback();
    console.error('Create CRM entry error:', err);
    return res.status(500).json({ success: false, message: 'Server error while creating CRM entry.' });
  }
};

// GET /api/crm  (admin sees all, employee sees own submitted + assigned to them)
exports.listCrmEntries = async (req, res) => {
  try {
    const where = req.user.role === 'admin'
      ? {}
      : { [Op.or]: [{ submitted_by_id: req.user.id }, { assigned_to_id: req.user.id }] };
    const entries = await CrmEntry.findAll({ where, order: [['id', 'DESC']] });
    return res.json({ success: true, entries });
  } catch (err) {
    console.error('List CRM entries error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching CRM entries.' });
  }
};

// GET /api/crm/:id
exports.getCrmEntry = async (req, res) => {
  try {
    const entry = await CrmEntry.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'CRM entry not found.' });
    }
    if (!canAccess(entry, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this CRM entry.' });
    }

    const [documents, linkedEntries, comboEntries] = await Promise.all([
      CrmDocument.findAll({ where: { client_phone_normalized: entry.client_phone_normalized }, order: [['createdAt', 'DESC']] }),
      CrmEntry.findAll({
        where: { client_phone_normalized: entry.client_phone_normalized, id: { [Op.ne]: entry.id } },
        attributes: ['id', 'company_name', 'service', 'status', 'createdAt'],
        order: [['id', 'DESC']],
      }),
      entry.combo_group_id
        ? CrmEntry.findAll({
          where: { combo_group_id: entry.combo_group_id, id: { [Op.ne]: entry.id } },
          attributes: ['id', 'company_name', 'service', 'status', 'total_quoted_amount', 'createdAt'],
          order: [['id', 'ASC']],
        })
        : [],
    ]);

    return res.json({
      success: true,
      entry,
      documents,
      linkedEntries,
      comboEntries,
      totals: computeTotals(entry),
      is_editable: isEditable(entry, req.user),
    });
  } catch (err) {
    console.error('Get CRM entry error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching CRM entry.' });
  }
};

// PUT /api/crm/:id  (admin unrestricted; employee only own + still editable)
exports.updateCrmEntry = async (req, res) => {
  try {
    const entry = await CrmEntry.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'CRM entry not found.' });
    }
    if (!isEditable(entry, req.user)) {
      return res.status(403).json({ success: false, message: 'This CRM entry is no longer editable.' });
    }

    const body = req.body;
    if (body.mode !== undefined && !CRM_MODE_VALUES.includes(body.mode)) {
      return res.status(400).json({ success: false, message: 'Invalid mode.' });
    }

    ENTRY_FIELDS.forEach((f) => { if (body[f] !== undefined) entry[f] = body[f]; });
    const partErrors = applyPaymentParts(entry, body);
    if (partErrors.length) {
      return res.status(400).json({ success: false, message: partErrors[0] });
    }

    await entry.save();
    return res.json({ success: true, message: 'CRM entry updated successfully.', entry });
  } catch (err) {
    console.error('Update CRM entry error:', err);
    return res.status(500).json({ success: false, message: 'Server error while updating CRM entry.' });
  }
};

// PUT /api/crm/:id/status  (admin only) - stage/step/assignment/closure
exports.updateStatus = async (req, res) => {
  try {
    const entry = await CrmEntry.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'CRM entry not found.' });
    }

    const { status, current_step, assigned_to_id, lead_closed_by, lead_closed_by_email } = req.body;

    if (status !== undefined) {
      if (!CRM_STATUS_VALUES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status.' });
      }
      entry.status = status;
    }
    if (current_step !== undefined) {
      if (!CRM_STEP_VALUES.includes(current_step)) {
        return res.status(400).json({ success: false, message: 'Invalid step.' });
      }
      entry.current_step = current_step;
    }
    if (assigned_to_id !== undefined) {
      if (!assigned_to_id) {
        entry.assigned_to_id = null;
        entry.assigned_to_name = null;
      } else {
        const assignee = await User.findByPk(assigned_to_id);
        if (!assignee) {
          return res.status(400).json({ success: false, message: 'Assignee not found.' });
        }
        entry.assigned_to_id = assignee.id;
        entry.assigned_to_name = assignee.name;
        if (entry.current_step === 'submitted') entry.current_step = 'assigned';
      }
    }
    if (lead_closed_by !== undefined) entry.lead_closed_by = lead_closed_by;
    if (lead_closed_by_email !== undefined) entry.lead_closed_by_email = lead_closed_by_email;

    await entry.save();
    return res.json({ success: true, message: 'CRM entry workflow updated.', entry });
  } catch (err) {
    console.error('Update CRM status error:', err);
    return res.status(500).json({ success: false, message: 'Server error while updating CRM entry workflow.' });
  }
};

// PUT /api/crm/:id/remark  (admin + assignee) - internal BDE/Admin notes
exports.updateRemark = async (req, res) => {
  try {
    const entry = await CrmEntry.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'CRM entry not found.' });
    }
    if (req.user.role !== 'admin' && entry.assigned_to_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this remark.' });
    }
    entry.admin_remark = req.body.admin_remark || '';
    await entry.save();
    return res.json({ success: true, message: 'Remark updated.', entry });
  } catch (err) {
    console.error('Update CRM remark error:', err);
    return res.status(500).json({ success: false, message: 'Server error while updating remark.' });
  }
};

// POST /api/crm/:id/payment-proof  (admin or the submitter)
exports.uploadPaymentProof = async (req, res) => {
  try {
    const entry = await CrmEntry.findByPk(req.params.id);
    if (!entry) {
      removeUploadedFile(req.file);
      return res.status(404).json({ success: false, message: 'CRM entry not found.' });
    }
    if (req.user.role !== 'admin' && entry.submitted_by_id !== req.user.id) {
      removeUploadedFile(req.file);
      return res.status(403).json({ success: false, message: 'You do not have permission to upload for this CRM entry.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    if (entry.payment_proof_path) {
      fs.unlink(path.join(BACKEND_ROOT, entry.payment_proof_path), () => {});
    }
    entry.payment_proof_path = `/uploads/crm/payment-proofs/${req.file.filename}`;
    await entry.save();
    return res.json({ success: true, message: 'Payment proof uploaded.', entry });
  } catch (err) {
    removeUploadedFile(req.file);
    console.error('Upload payment proof error:', err);
    return res.status(500).json({ success: false, message: 'Server error while uploading payment proof.' });
  }
};

// POST /api/crm/:id/documents  (admin, submitter, or assignee)
exports.uploadDocument = async (req, res) => {
  try {
    const entry = await CrmEntry.findByPk(req.params.id);
    if (!entry) {
      removeUploadedFile(req.file);
      return res.status(404).json({ success: false, message: 'CRM entry not found.' });
    }
    if (!canAccess(entry, req.user)) {
      removeUploadedFile(req.file);
      return res.status(403).json({ success: false, message: 'You do not have access to this CRM entry.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const doc = await CrmDocument.create({
      crm_entry_id: entry.id,
      client_phone_normalized: entry.client_phone_normalized,
      title: req.body.title || req.file.originalname,
      doc_type: req.body.doc_type || 'General',
      file_path: `/uploads/crm/documents/${req.file.filename}`,
      original_filename: req.file.originalname,
      uploaded_by_id: req.user.id,
      uploaded_by_name: req.user.name,
    });
    return res.status(201).json({ success: true, message: 'Document uploaded.', document: doc });
  } catch (err) {
    removeUploadedFile(req.file);
    console.error('Upload CRM document error:', err);
    return res.status(500).json({ success: false, message: 'Server error while uploading document.' });
  }
};

// DELETE /api/crm/:id  (admin only)
exports.deleteCrmEntry = async (req, res) => {
  try {
    const entry = await CrmEntry.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'CRM entry not found.' });
    }
    if (entry.payment_proof_path) {
      fs.unlink(path.join(BACKEND_ROOT, entry.payment_proof_path), () => {});
    }
    await entry.destroy();
    return res.json({ success: true, message: 'CRM entry deleted successfully.' });
  } catch (err) {
    console.error('Delete CRM entry error:', err);
    return res.status(500).json({ success: false, message: 'Server error while deleting CRM entry.' });
  }
};

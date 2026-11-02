const { Op } = require('sequelize');
const { sequelize, Invoice, InvoiceItem, CompanySetting, User } = require('../models');
const { generateBillNumber, generateProformaNumber } = require('../utils/generateInvoiceNumber');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { inScope } = require('../middleware/scope');

// HSN/SAC code used for new line items when none is entered (998312 = business consulting services).
const DEFAULT_HSN = '998312';

function computeTotals(items, applyGst, gstRate) {
  const subTotal = items.reduce((sum, it) => sum + (Number(it.qty) * Number(it.rate)), 0);
  const gstAmount = applyGst ? +(subTotal * (Number(gstRate) / 100)).toFixed(2) : 0;
  const grandTotal = +(subTotal + gstAmount).toFixed(2);
  return { subTotal: +subTotal.toFixed(2), gstAmount, grandTotal };
}

// POST /api/invoices  (admin + employee)
exports.createInvoice = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      invoice_date, branch,
      client_name, client_address, client_phone, client_gstin, client_state,
      apply_gst, gst_rate, gst_type, remarks,
      items,
    } = req.body;

    if (!client_name || !invoice_date) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Client name and invoice date are required.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'At least one line item is required.' });
    }

    const invoiceNumber = await generateProformaNumber();
    const rate = apply_gst ? (gst_rate || 18) : 0;
    const { subTotal, gstAmount, grandTotal } = computeTotals(items, apply_gst, rate);

    // All invoices are created as Proforma. Converting to a Tax Invoice is a
    // separate admin-only action performed from the invoice view page.
    const invoice = await Invoice.create({
      invoice_number: invoiceNumber,
      invoice_type: 'proforma',
      invoice_date,
      branch,
      client_name,
      client_address,
      client_phone,
      client_gstin,
      client_state,
      apply_gst: !!apply_gst,
      gst_rate: rate,
      gst_type: gst_type || 'cgst_sgst',
      sub_total: subTotal,
      gst_amount: gstAmount,
      grand_total: grandTotal,
      remarks,
      generated_by_id: req.user.id,
      generated_by_name: req.user.name,
    }, { transaction: t });

    const itemRows = items.map((it, idx) => ({
      invoice_id: invoice.id,
      s_no: idx + 1,
      particulars: it.particulars,
      hsn: it.hsn || DEFAULT_HSN,
      qty: it.qty || 1,
      rate: it.rate || 0,
      amount: +((it.qty || 1) * (it.rate || 0)).toFixed(2),
    }));
    await InvoiceItem.bulkCreate(itemRows, { transaction: t });

    await t.commit();

    const fullInvoice = await Invoice.findByPk(invoice.id, { include: [{ model: InvoiceItem, as: 'items' }] });
    return res.status(201).json({ success: true, message: 'Invoice created successfully.', invoice: fullInvoice });
  } catch (err) {
    await t.rollback();
    console.error('Create invoice error:', err);
    return res.status(500).json({ success: false, message: 'Server error while creating invoice.' });
  }
};

// GET /api/invoices  (admin sees all, project manager sees their team's, employee sees own)
exports.listInvoices = async (req, res) => {
  try {
    const where = req.user.role === 'admin'
      ? {}
      : req.user.role === 'project_manager'
        ? { generated_by_id: { [Op.in]: req.user.managedIds } }
        : { generated_by_id: req.user.id };
    const invoices = await Invoice.findAll({
      where,
      order: [['id', 'DESC']],
      include: [{ model: InvoiceItem, as: 'items' }],
    });
    return res.json({ success: true, invoices });
  } catch (err) {
    console.error('List invoices error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching invoices.' });
  }
};

// GET /api/invoices/:id
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, { include: [{ model: InvoiceItem, as: 'items' }] });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    if (!inScope(invoice.generated_by_id, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this invoice.' });
    }
    return res.json({ success: true, invoice });
  } catch (err) {
    console.error('Get invoice error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching invoice.' });
  }
};

// GET /api/invoices/:id/pdf
exports.downloadInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, { include: [{ model: InvoiceItem, as: 'items' }] });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    if (!inScope(invoice.generated_by_id, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this invoice.' });
    }

    let settings = await CompanySetting.findOne();
    if (!settings) settings = await CompanySetting.create({});

    const pdfBuffer = await generateInvoicePDF({
      invoice: invoice.toJSON(),
      items: invoice.items.map((i) => i.toJSON()),
      settings: settings.toJSON(),
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number.replace('/', '-')}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('Generate PDF error:', err);
    return res.status(500).json({ success: false, message: 'Server error while generating PDF.' });
  }
};

// PUT /api/invoices/:id/convert-to-tax  (admin, or PM/employee granted the permission, within their scope)
exports.convertToTaxInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, { include: [{ model: InvoiceItem, as: 'items' }] });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    if (!inScope(invoice.generated_by_id, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this invoice.' });
    }
    if (invoice.invoice_type === 'tax') {
      return res.status(400).json({ success: false, message: 'This invoice is already a Tax Invoice.' });
    }
    if (invoice.invoice_type !== 'proforma') {
      return res.status(400).json({ success: false, message: 'Only a Proforma Invoice can be converted to a Tax Invoice.' });
    }
    // The Tax Invoice takes the next number in the bill series (e.g. 26-27/001). The
    // Proforma's own INV- number is kept as a reference so it is never lost.
    invoice.proforma_number = invoice.invoice_number;
    invoice.invoice_number = await generateBillNumber();
    invoice.invoice_type = 'tax';
    await invoice.save();
    return res.json({ success: true, message: `Invoice converted to Tax Invoice ${invoice.invoice_number}.`, invoice });
  } catch (err) {
    console.error('Convert to tax invoice error:', err);
    return res.status(500).json({ success: false, message: 'Server error while converting invoice.' });
  }
};

// POST /api/invoices/:id/generate-simple  (admin only)
// Creates a NEW, separate Invoice record (its own id + next number in the bill series) that
// mirrors this invoice's client/items/amounts but displays GST as a single
// inclusive Sub-Total with an "18% GST is applicable" note, instead of a broken-out
// GST line. The source invoice (Proforma or Tax) is left completely untouched.
exports.generateSimpleInvoice = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const source = await Invoice.findByPk(req.params.id, { include: [{ model: InvoiceItem, as: 'items' }] });
    if (!source) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    if (!inScope(source.generated_by_id, req.user)) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'You do not have access to this invoice.' });
    }
    if (source.invoice_type === 'simple') {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'This is already a simple Invoice.' });
    }

    const invoiceNumber = await generateBillNumber();

    const invoice = await Invoice.create({
      invoice_number: invoiceNumber,
      invoice_type: 'simple',
      invoice_date: source.invoice_date,
      branch: source.branch,
      client_name: source.client_name,
      client_address: source.client_address,
      client_phone: source.client_phone,
      client_gstin: source.client_gstin,
      client_state: source.client_state,
      apply_gst: source.apply_gst,
      gst_rate: source.gst_rate,
      gst_type: source.gst_type,
      sub_total: source.sub_total,
      gst_amount: source.gst_amount,
      grand_total: source.grand_total,
      remarks: source.remarks,
      generated_by_id: req.user.id,
      generated_by_name: req.user.name,
    }, { transaction: t });

    const itemRows = source.items.map((it) => ({
      invoice_id: invoice.id,
      s_no: it.s_no,
      particulars: it.particulars,
      hsn: it.hsn,
      qty: it.qty,
      rate: it.rate,
      amount: it.amount,
    }));
    await InvoiceItem.bulkCreate(itemRows, { transaction: t });

    await t.commit();

    const fullInvoice = await Invoice.findByPk(invoice.id, { include: [{ model: InvoiceItem, as: 'items' }] });
    return res.status(201).json({ success: true, message: 'Invoice generated successfully.', invoice: fullInvoice });
  } catch (err) {
    await t.rollback();
    console.error('Generate simple invoice error:', err);
    return res.status(500).json({ success: false, message: 'Server error while generating invoice.' });
  }
};

// DELETE /api/invoices/:id  (admin, or PM/employee granted the permission, within their scope)
exports.deleteInvoice = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    if (!inScope(invoice.generated_by_id, req.user)) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'You do not have access to this invoice.' });
    }
    await InvoiceItem.destroy({ where: { invoice_id: invoice.id }, transaction: t });
    await invoice.destroy({ transaction: t });
    await t.commit();
    return res.json({ success: true, message: 'Invoice deleted successfully.' });
  } catch (err) {
    await t.rollback();
    console.error('Delete invoice error:', err);
    return res.status(500).json({ success: false, message: 'Server error while deleting invoice.' });
  }
};

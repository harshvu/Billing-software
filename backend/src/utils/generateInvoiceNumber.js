const { Invoice } = require('../models');
const { Op } = require('sequelize');

// Generates the next sequential invoice number for a given invoice type.
// Proforma/Tax share one sequence starting at INV-101 (a Tax Invoice keeps the
// same number it was given as a Proforma — this function only runs at creation).
// The "simple" Invoice type has its own independent sequence starting at INV-01,
// zero-padded to 2 digits, so it never collides with or affects the other sequence.
async function generateInvoiceNumber(type = 'proforma') {
  const isSimple = type === 'simple';
  const where = isSimple ? { invoice_type: 'simple' } : { invoice_type: { [Op.ne]: 'simple' } };

  const last = await Invoice.findOne({
    where,
    order: [['id', 'DESC']],
  });

  let nextSeq = isSimple ? 1 : 101;
  if (last && last.invoice_number) {
    const match = last.invoice_number.match(/(\d+)$/);
    if (match) {
      nextSeq = parseInt(match[1], 10) + 1;
    }
  }

  const seqStr = isSimple ? String(nextSeq).padStart(2, '0') : String(nextSeq);
  return `INV-${seqStr}`;
}

module.exports = generateInvoiceNumber;

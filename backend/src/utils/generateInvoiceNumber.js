const { Invoice } = require('../models');
const { Op } = require('sequelize');

// Generates the next sequential invoice number, e.g. INV-2158
async function generateInvoiceNumber() {
  const last = await Invoice.findOne({
    order: [['id', 'DESC']],
  });

  let nextSeq = 2157; // matches the starting sequence shown in the reference forms
  if (last && last.invoice_number) {
    const match = last.invoice_number.match(/(\d+)$/);
    if (match) {
      nextSeq = parseInt(match[1], 10) + 1;
    }
  }
  return `INV-${nextSeq}`;
}

module.exports = generateInvoiceNumber;

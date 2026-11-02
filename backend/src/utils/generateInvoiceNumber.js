// Invoice numbering. There are two separate number series.
//
// 1. Bill series (Tax Invoices and "Generate Invoice" bills):
//    "<financial year>/<3-digit running number>", for example 26-27/001, 26-27/002.
//    The Indian financial year runs from 1 April to 31 March, so the prefix rolls over
//    to 27-28/001 by itself every April. A number from this series is given at the moment
//    a Tax Invoice or a bill is created, so the series stays in unbroken order. A Proforma
//    never uses it.
//
// 2. Proforma series: INV-209, INV-210 ... continuing from the last Proforma number.
//    When a Proforma is converted to a Tax Invoice it receives a bill number and the
//    original INV- number is kept on the record as its proforma reference.
//
// Numbers already issued (INV-101 ... and INV-01) are never renamed or renumbered.

const { Invoice } = require('../models');
const { Op } = require('sequelize');

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const FIRST_PROFORMA_NUMBER = 101;

// Returns the financial year label for a date, e.g. any date from 1 Apr 2026 to
// 31 Mar 2027 gives "26-27". The date is read in Indian time so the switch over
// happens at midnight in India, not midnight on the server.
function financialYearLabel(now = new Date()) {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const month = ist.getUTCMonth(); // 0 = January, 3 = April
  const startYear = month >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
  const twoDigits = (year) => String(year % 100).padStart(2, '0');
  return `${twoDigits(startYear)}-${twoDigits(startYear + 1)}`;
}

// Next number in the current financial year's bill series: finds the highest running
// number already used under this year's prefix and adds one (001 if none yet).
async function generateBillNumber() {
  const prefix = `${financialYearLabel()}/`;

  const existing = await Invoice.findAll({
    where: { invoice_number: { [Op.like]: `${prefix}%` } },
    attributes: ['invoice_number'],
  });

  let highest = 0;
  existing.forEach((row) => {
    const match = row.invoice_number.match(/^\d{2}-\d{2}\/(\d+)$/);
    if (match) highest = Math.max(highest, parseInt(match[1], 10));
  });

  return `${prefix}${String(highest + 1).padStart(3, '0')}`;
}

// Next Proforma number: the highest INV-<number> ever issued, plus one. This looks at the
// invoice number AND at the saved proforma reference of converted Tax Invoices, so the
// number of a Proforma that has since become a Tax Invoice is never handed out again.
// "Generate Invoice" records (type simple) are left out of the first check because they
// used a separate INV-01 style counter in the past.
async function generateProformaNumber() {
  const existing = await Invoice.findAll({
    where: {
      [Op.or]: [
        { invoice_number: { [Op.like]: 'INV-%' } },
        { proforma_number: { [Op.like]: 'INV-%' } },
      ],
    },
    attributes: ['invoice_number', 'invoice_type', 'proforma_number'],
  });

  let highest = FIRST_PROFORMA_NUMBER - 1;
  const consider = (value) => {
    const match = (value || '').match(/^INV-(\d+)$/);
    if (match) highest = Math.max(highest, parseInt(match[1], 10));
  };
  existing.forEach((row) => {
    if (row.invoice_type !== 'simple') consider(row.invoice_number);
    consider(row.proforma_number);
  });

  return `INV-${highest + 1}`;
}

module.exports = { generateBillNumber, generateProformaNumber, financialYearLabel };

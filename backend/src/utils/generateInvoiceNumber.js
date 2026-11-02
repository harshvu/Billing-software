// Invoice numbering.
//
// New invoices use the bill series "<financial year>/<3-digit running number>",
// for example 26-27/001, 26-27/002 and so on. The Indian financial year runs from
// 1 April to 31 March, so the prefix rolls over to 27-28/001 by itself every April.
//
// Older invoices keep their original numbers (INV-101 ... and INV-01). They are never
// renamed or renumbered; this file only decides the number for invoices created from now on.
// Proforma, Tax and "Generate Invoice" records all share this one series, and a Proforma
// that is converted to a Tax Invoice keeps the number it was given when it was created.

const { Invoice } = require('../models');
const { Op } = require('sequelize');

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

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

// Works out the next number in the current financial year's series: finds the highest
// running number already used under this year's prefix and adds one (001 if none yet).
async function generateInvoiceNumber() {
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

module.exports = generateInvoiceNumber;
module.exports.financialYearLabel = financialYearLabel;

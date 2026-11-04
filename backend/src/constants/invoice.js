// HSN/SAC code printed against invoice line items when none is entered.
// 998312 = business consulting services.
// It is used when an invoice is created or edited, when a Proforma is converted to a Tax
// Invoice, and as the value shown on the PDF for older lines that were saved without one.
const DEFAULT_HSN = '998312';

module.exports = { DEFAULT_HSN };

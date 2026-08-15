const { sequelize, Invoice, CrmEntry } = require('../models');

// GET /api/reports/summary  (admin sees global totals + employee-wise breakdown; employee sees own totals only)
exports.getSummary = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const invoiceWhere = isAdmin ? {} : { generated_by_id: req.user.id };
    const crmWhere = isAdmin ? {} : { submitted_by_id: req.user.id };

    const [invoiceRows, totalCrm] = await Promise.all([
      Invoice.findAll({
        attributes: [
          'generated_by_id', 'generated_by_name', 'invoice_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('grand_total')), 'amount'],
        ],
        where: invoiceWhere,
        group: ['generated_by_id', 'generated_by_name', 'invoice_type'],
        raw: true,
      }),
      CrmEntry.count({ where: crmWhere }),
    ]);

    const totals = {
      crm: totalCrm, invoices: 0, proforma: 0, tax: 0, proforma_amount: 0, tax_amount: 0,
    };
    invoiceRows.forEach((r) => {
      const count = Number(r.count);
      const amount = Number(r.amount) || 0;
      totals.invoices += count;
      if (r.invoice_type === 'proforma') { totals.proforma += count; totals.proforma_amount += amount; }
      if (r.invoice_type === 'tax') { totals.tax += count; totals.tax_amount += amount; }
    });

    let byEmployee = null;
    if (isAdmin) {
      const crmRows = await CrmEntry.findAll({
        attributes: [
          'submitted_by_id', 'submitted_by_name',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['submitted_by_id', 'submitted_by_name'],
        raw: true,
      });

      const map = new Map();
      const getRow = (id, name) => {
        if (!map.has(id)) map.set(id, { id, name, crm: 0, invoices: 0, proforma: 0, tax: 0, proforma_amount: 0, tax_amount: 0 });
        return map.get(id);
      };
      invoiceRows.forEach((r) => {
        const row = getRow(r.generated_by_id, r.generated_by_name);
        const count = Number(r.count);
        const amount = Number(r.amount) || 0;
        row.invoices += count;
        if (r.invoice_type === 'proforma') { row.proforma += count; row.proforma_amount += amount; }
        if (r.invoice_type === 'tax') { row.tax += count; row.tax_amount += amount; }
      });
      crmRows.forEach((r) => {
        const row = getRow(r.submitted_by_id, r.submitted_by_name);
        row.crm += Number(r.count);
      });

      byEmployee = Array.from(map.values()).sort((a, b) => (b.invoices + b.crm) - (a.invoices + a.crm));
    }

    return res.json({ success: true, totals, byEmployee });
  } catch (err) {
    console.error('Get report summary error:', err);
    return res.status(500).json({ success: false, message: 'Server error while generating report.' });
  }
};

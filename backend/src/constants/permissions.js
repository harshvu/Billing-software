// Permission schema for the employee-permissions module.
// Employees & Settings management stay admin-only always (not employee-grantable)
// to avoid privilege escalation (e.g. an employee creating/promoting other accounts,
// or rewriting the company's bank/GST details used on every invoice).
const PERMISSION_SCHEMA = {
  invoices: {
    label: 'Invoices',
    actions: {
      menu: 'Show Invoices menu',
      view: 'View invoices',
      create: 'Create invoices',
      download: 'Download PDF',
      convertToTax: 'Convert to Tax Invoice',
      generateInvoice: 'Generate Invoice',
      delete: 'Delete invoices',
    },
  },
  crm: {
    label: 'CRM',
    actions: {
      menu: 'Show CRM menu',
      view: 'View CRM entries',
      create: 'Create CRM entries',
      uploadPaymentProof: 'Upload payment proof',
      uploadDocument: 'Upload client documents',
      updateWorkflow: 'Update status / stage / assignment',
      delete: 'Delete CRM entries',
    },
  },
  reports: {
    label: 'Reports',
    actions: {
      menu: 'Show Reports menu',
      view: 'View reports',
    },
  },
};

// What a newly-created (or not-yet-configured) employee can do by default.
// Matches what employees could already do before this permissions module existed,
// so turning this on does not silently cut off any existing employee's access.
// Admin-only actions (delete/convert/workflow-status) default OFF — admin can grant them per employee.
const DEFAULT_EMPLOYEE_PERMISSIONS = {
  invoices: { menu: true, view: true, create: true, download: true, convertToTax: false, generateInvoice: false, delete: false },
  crm: { menu: true, view: true, create: true, uploadPaymentProof: true, uploadDocument: true, updateWorkflow: false, delete: false },
  reports: { menu: true, view: true },
};

// Fills in any missing keys (e.g. after a schema change) with defaults, so old
// stored permission objects never crash on a newly added action.
function withDefaults(permissions) {
  const merged = {};
  for (const moduleKey of Object.keys(PERMISSION_SCHEMA)) {
    merged[moduleKey] = {
      ...DEFAULT_EMPLOYEE_PERMISSIONS[moduleKey],
      ...(permissions && permissions[moduleKey] ? permissions[moduleKey] : {}),
    };
  }
  return merged;
}

module.exports = { PERMISSION_SCHEMA, DEFAULT_EMPLOYEE_PERMISSIONS, withDefaults };

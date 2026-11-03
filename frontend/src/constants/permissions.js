// Mirrors backend/src/constants/permissions.js — used to render the admin's
// permission-editing UI and to gate buttons/menus for the logged-in employee.
export const PERMISSION_SCHEMA = {
  invoices: {
    label: 'Invoices',
    actions: {
      menu: 'Show Proforma Invoice menu',
      view: 'View invoices',
      create: 'Create Proforma invoices',
      taxMenu: 'Show Tax Invoice menu',
      createTax: 'Create Tax invoices directly',
      edit: 'Edit invoices (Proforma and Tax)',
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

// Admins always have every permission. Project Managers are scoped by team
// (not by these toggles) but otherwise act like an admin within that scope, so
// they pass every check here too. Employees fall back to their stored
// permissions object (already defaulted server-side, but guard anyway).
export const hasPermission = (user, moduleKey, action) => {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'project_manager') return true;
  return !!(user.permissions && user.permissions[moduleKey] && user.permissions[moduleKey][action]);
};

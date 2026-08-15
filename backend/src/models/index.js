const sequelize = require('../config/db');
const User = require('./User');
const CompanySetting = require('./CompanySetting');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const CrmEntry = require('./CrmEntry');
const CrmDocument = require('./CrmDocument');

// Associations
User.hasMany(Invoice, { foreignKey: 'generated_by_id', as: 'invoices' });
Invoice.belongsTo(User, { foreignKey: 'generated_by_id', as: 'creator' });

User.hasMany(User, { foreignKey: 'created_by', as: 'employees' });
User.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id', as: 'items', onDelete: 'CASCADE' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });

User.hasMany(CrmEntry, { foreignKey: 'submitted_by_id', as: 'submittedCrmEntries' });
CrmEntry.belongsTo(User, { foreignKey: 'submitted_by_id', as: 'submitter' });

User.hasMany(CrmEntry, { foreignKey: 'assigned_to_id', as: 'assignedCrmEntries' });
CrmEntry.belongsTo(User, { foreignKey: 'assigned_to_id', as: 'assignee' });

CrmEntry.hasMany(CrmDocument, { foreignKey: 'crm_entry_id', as: 'documents', onDelete: 'SET NULL' });
CrmDocument.belongsTo(CrmEntry, { foreignKey: 'crm_entry_id' });

module.exports = { sequelize, User, CompanySetting, Invoice, InvoiceItem, CrmEntry, CrmDocument };

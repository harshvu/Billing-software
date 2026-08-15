const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const normalizePhone = require('../utils/normalizePhone');

const CrmEntry = sequelize.define('CrmEntry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  // Company Info
  company_name: { type: DataTypes.STRING, allowNull: false },
  cin_llp_no: { type: DataTypes.STRING, allowNull: true },
  company_email: { type: DataTypes.STRING, allowNull: false },
  company_mobile: { type: DataTypes.STRING, allowNull: false },
  contact_person: { type: DataTypes.STRING, allowNull: false },
  website: { type: DataTypes.STRING, allowNull: true },
  company_pan: { type: DataTypes.STRING, allowNull: true },
  gst_no: { type: DataTypes.STRING, allowNull: true },
  industry: { type: DataTypes.STRING, allowNull: true },
  sector: { type: DataTypes.STRING, allowNull: true },
  city: { type: DataTypes.STRING, allowNull: true },
  state: { type: DataTypes.STRING, allowNull: false },
  complete_address: { type: DataTypes.TEXT, allowNull: false },

  client_phone_normalized: { type: DataTypes.STRING(10), allowNull: true },

  // Remark captured at submission
  user_remark: { type: DataTypes.TEXT, allowNull: true },

  // Payment & Billing
  payment_contact_no: { type: DataTypes.STRING, allowNull: false },
  payment_email: { type: DataTypes.STRING, allowNull: false },
  startup_contact_no: { type: DataTypes.STRING, allowNull: true },
  startup_email: { type: DataTypes.STRING, allowNull: true },

  // Invoice Details
  invoice_company_name: { type: DataTypes.STRING, allowNull: false },
  invoice_contact: { type: DataTypes.STRING, allowNull: false },
  invoice_email: { type: DataTypes.STRING, allowNull: false },
  invoice_pan: { type: DataTypes.STRING, allowNull: false },
  invoice_gst: { type: DataTypes.STRING, allowNull: true },
  invoice_commission: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  after_success_payment: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },

  // Service & Deal
  service: { type: DataTypes.STRING, allowNull: false },
  mode: { type: DataTypes.STRING, allowNull: false, defaultValue: 'refundable' },
  percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  total_quoted_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  booking_mode: { type: DataTypes.STRING, allowNull: false },
  deal_remark: { type: DataTypes.TEXT, allowNull: true },

  // Payment Schedule (up to 4 installments, embedded on this row)
  payment_part1_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  payment_part1_gst: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  payment_part1_date: { type: DataTypes.DATEONLY, allowNull: false },

  payment_part2_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  payment_part2_gst: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  payment_part2_date: { type: DataTypes.DATEONLY, allowNull: true },

  payment_part3_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  payment_part3_gst: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  payment_part3_date: { type: DataTypes.DATEONLY, allowNull: true },

  payment_part4_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  payment_part4_gst: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  payment_part4_date: { type: DataTypes.DATEONLY, allowNull: true },

  // Workflow
  submitted_by_id: { type: DataTypes.INTEGER, allowNull: false },
  submitted_by_name: { type: DataTypes.STRING, allowNull: false },
  assigned_to_id: { type: DataTypes.INTEGER, allowNull: true },
  assigned_to_name: { type: DataTypes.STRING, allowNull: true },
  lead_closed_by: { type: DataTypes.STRING, allowNull: true },
  lead_closed_by_email: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'stage1' },
  current_step: { type: DataTypes.STRING, allowNull: false, defaultValue: 'submitted' },

  // Shared by all entries created together as one Combo Sale submission
  combo_group_id: { type: DataTypes.STRING(64), allowNull: true },

  // BDE / Admin internal notes
  admin_remark: { type: DataTypes.TEXT, allowNull: true },

  // Payment Proof
  payment_proof_path: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'crm_entries',
  indexes: [
    { fields: ['submitted_by_id'] },
    { fields: ['assigned_to_id'] },
    { fields: ['status'] },
    { fields: ['client_phone_normalized'] },
    { fields: ['combo_group_id'] },
  ],
  hooks: {
    beforeValidate: (entry) => {
      entry.client_phone_normalized = normalizePhone(entry.company_mobile);
    },
  },
});

module.exports = CrmEntry;

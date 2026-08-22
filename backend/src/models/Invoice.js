const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  invoice_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  invoice_type: { type: DataTypes.ENUM('proforma', 'tax', 'simple'), allowNull: false, defaultValue: 'proforma' },
  invoice_date: { type: DataTypes.DATEONLY, allowNull: false },

  branch: { type: DataTypes.STRING, allowNull: true },

  client_name: { type: DataTypes.STRING, allowNull: false },
  client_address: { type: DataTypes.TEXT, allowNull: true },
  client_phone: { type: DataTypes.STRING, allowNull: true },
  client_gstin: { type: DataTypes.STRING, allowNull: true },
  client_state: { type: DataTypes.STRING, allowNull: true },

  apply_gst: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  gst_rate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 18.0 },
  gst_type: { type: DataTypes.ENUM('igst', 'cgst_sgst', 'none'), allowNull: false, defaultValue: 'igst' },

  sub_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  gst_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  grand_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },

  remarks: { type: DataTypes.TEXT, allowNull: true },

  generated_by_id: { type: DataTypes.INTEGER, allowNull: false },
  generated_by_name: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'invoices',
});

module.exports = Invoice;

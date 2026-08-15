const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const InvoiceItem = sequelize.define('InvoiceItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  invoice_id: { type: DataTypes.INTEGER, allowNull: false },
  s_no: { type: DataTypes.INTEGER, allowNull: false },
  particulars: { type: DataTypes.STRING, allowNull: false },
  hsn: { type: DataTypes.STRING, allowNull: true },
  qty: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 1 },
  rate: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
}, {
  tableName: 'invoice_items',
});

module.exports = InvoiceItem;

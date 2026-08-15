const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CompanySetting = sequelize.define('CompanySetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  company_name: { type: DataTypes.STRING, allowNull: false, defaultValue: 'BUSINESSMINT SOLUTION FINANCIAL SERVICES PRIVATE LIMITED' },
  gstin: { type: DataTypes.STRING, allowNull: true, defaultValue: '24AAOCR9991A1ZZ' },
  phone: { type: DataTypes.STRING, allowNull: true, defaultValue: '+91 9724033596' },
  address: { type: DataTypes.TEXT, allowNull: true, defaultValue: '815-816, Vihav Supremus-2, Nr New Court, Beside R K Plaza, Nr Ward Office 11, Vasna, Vadodara, Gujarat - 390007' },
  logo_text: { type: DataTypes.STRING, allowNull: true, defaultValue: 'BUSINESSMINT SOLUTION' },
  bank_account_name: { type: DataTypes.STRING, allowNull: true, defaultValue: 'BUSINESSMINT SOLUTION FINANCIAL SERVICES PVT LTD' },
  bank_account_no: { type: DataTypes.STRING, allowNull: true, defaultValue: '404005000998' },
  bank_ifsc: { type: DataTypes.STRING, allowNull: true, defaultValue: 'ICIC0004040' },
  upi_id: { type: DataTypes.STRING, allowNull: true, defaultValue: 'rexer26340.ibz@icici' },
  default_gst_rate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 18.0 },
}, {
  tableName: 'company_settings',
});

module.exports = CompanySetting;

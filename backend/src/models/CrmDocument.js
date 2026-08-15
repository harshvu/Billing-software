const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CrmDocument = sequelize.define('CrmDocument', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  crm_entry_id: { type: DataTypes.INTEGER, allowNull: true },
  client_phone_normalized: { type: DataTypes.STRING(10), allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  doc_type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'General' },
  file_path: { type: DataTypes.STRING, allowNull: false },
  original_filename: { type: DataTypes.STRING, allowNull: false },
  uploaded_by_id: { type: DataTypes.INTEGER, allowNull: false },
  uploaded_by_name: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'crm_documents',
  indexes: [
    { fields: ['client_phone_normalized'] },
    { fields: ['crm_entry_id'] },
  ],
});

module.exports = CrmDocument;

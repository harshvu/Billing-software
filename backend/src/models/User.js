const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'employee'),
    allowNull: false,
    defaultValue: 'employee',
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  branch: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // Stored as TEXT (not the JSON column type) so this works identically on
  // MySQL 8 (production) and older MariaDB (local dev, no native JSON support).
  permissions: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('permissions');
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (e) { return null; }
    },
    set(value) {
      this.setDataValue('permissions', value ? JSON.stringify(value) : null);
    },
  },
}, {
  tableName: 'users',
});

module.exports = User;

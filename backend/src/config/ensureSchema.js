// Adds any new columns that older databases are missing.
//
// sequelize.sync() only creates tables that do not exist yet. It never adds a column to a
// table that already exists, so a database created before a field was introduced would
// break as soon as the code starts reading that field. This file closes that gap.
//
// It is safe to run on every start: a column is only added when it is missing, nothing is
// ever dropped, renamed or rewritten, and existing rows are left exactly as they are.

const { DataTypes } = require('sequelize');
const sequelize = require('./db');

// Columns added after their table was first created. Add new entries here in the future.
const ADDED_COLUMNS = [
  { table: 'company_settings', column: 'cin', definition: { type: DataTypes.STRING, allowNull: true } },
];

// Looks at each table above and adds the column only if it is not there yet.
async function ensureSchema() {
  const queryInterface = sequelize.getQueryInterface();
  for (const { table, column, definition } of ADDED_COLUMNS) {
    const existingColumns = await queryInterface.describeTable(table);
    if (!existingColumns[column]) {
      await queryInterface.addColumn(table, column, definition);
      console.log(`Schema updated: added ${table}.${column}`);
    }
  }
}

module.exports = ensureSchema;

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, CompanySetting } = require('./models');

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@rexera.com').toLowerCase();
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      const hashed = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123', 10);
      await User.create({
        name: process.env.DEFAULT_ADMIN_NAME || 'Super Admin',
        email: adminEmail,
        password: hashed,
        role: 'admin',
        status: 'active',
      });
      console.log(`Admin account created -> email: ${adminEmail} | password: ${process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123'}`);
    } else {
      console.log('Admin account already exists, skipping.');
    }

    const settings = await CompanySetting.findOne();
    if (!settings) {
      await CompanySetting.create({});
      console.log('Default company settings created.');
    } else {
      console.log('Company settings already exist, skipping.');
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();

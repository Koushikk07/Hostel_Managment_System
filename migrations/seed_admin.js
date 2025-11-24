// migrations/seed_admin.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../db');

async function seed() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  try {
    const [rows] = await db.query('SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1', [username, email]);
    if (rows.length) {
      console.log('Admin already exists:', rows[0].id);
      process.exit(0);
    }
    const hash = await bcrypt.hash(password, 12);
    const [res] = await db.query('INSERT INTO users (username, email, full_name, password_hash, role) VALUES (?, ?, ?, ?, ?)', [username, email, 'Administrator', hash, 'admin']);
    console.log('Admin created with id', res.insertId);
    process.exit(0);
  } catch (err) {
    console.error('Seed error', err);
    process.exit(1);
  }
}

seed();

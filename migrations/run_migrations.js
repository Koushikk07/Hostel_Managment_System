// migrations/run_migrations.js
const fs = require('fs');
const db = require('../db');

async function run() {
  try {
    const sql = fs.readFileSync(__dirname + '/schema.sql', 'utf8');
    // split naive; okay for migration SQL in this repo
    const parts = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
    for (const p of parts) {
      await db.query(p);
    }
    console.log('Migrations executed');
    process.exit(0);
  } catch (err) {
    console.error('Migration error', err);
    process.exit(1);
  }
}
run();

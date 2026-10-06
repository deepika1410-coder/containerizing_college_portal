const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigrations() {
  console.log('[Migration] Running database migrations...');
  await db.initializeDatabase();
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  
  // Split statements if needed or execute raw block
  await db.query(schemaSql);
  console.log('[Migration] All schema tables, constraints, and indexes successfully verified/created.');
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migration] Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations };

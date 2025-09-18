const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

async function runMigrations() {
  console.log('[MIGRATION] Starting schema migration runner...');
  const sqlFile = path.join(__dirname, '../../sql/001_create_audit_tables.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[MIGRATION] Successfully executed 001_create_audit_tables.sql!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[MIGRATION ERROR] Rollback triggered:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };

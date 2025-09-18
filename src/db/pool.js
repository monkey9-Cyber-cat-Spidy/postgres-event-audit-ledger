const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/audit_ledger',
  max: parseInt(process.env.PG_MAX_POOL || '20', 10),
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.PG_CONN_TIMEOUT_MS || '2000', 10),
});

pool.on('error', (err) => {
  console.error('[DATABASE POOL ERROR] Unexpected client error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};

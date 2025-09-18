const app = require('./app');
const { pool } = require('./db/pool');

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`[AUDIT-LEDGER] Microservice running on http://localhost:${PORT}`);
  console.log(`[AUDIT-LEDGER] Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful Shutdown
function handleShutdown(signal) {
  console.log(`\n[AUDIT-LEDGER] Received ${signal}. Draining connection pool and closing server...`);
  server.close(async () => {
    try {
      await pool.end();
      console.log('[AUDIT-LEDGER] PostgreSQL pool drained. Process terminated cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('[AUDIT-LEDGER ERROR] Error during shutdown:', err);
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

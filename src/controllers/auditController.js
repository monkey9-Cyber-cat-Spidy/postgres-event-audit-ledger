const { query } = require('../db/pool');

async function getHealth(req, res) {
  const start = Date.now();
  try {
    const result = await query('SELECT NOW() as now, COUNT(*) as count FROM audit_logs');
    const latency = Date.now() - start;
    return res.json({
      status: 'healthy',
      latency_ms: latency,
      total_records: parseInt(result.rows[0].count, 10),
      timestamp: result.rows[0].now,
      uptime_seconds: process.uptime()
    });
  } catch (err) {
    // If table doesn't exist yet, still respond with graceful DB connection test
    return res.json({
      status: 'degraded',
      latency_ms: Date.now() - start,
      message: 'Database reachable but schema uninitialized. Run npm run migrate.',
      error: err.message,
      uptime_seconds: process.uptime()
    });
  }
}

async function listAuditLogs(req, res) {
  const { table, operation, recordId, limit = 50, offset = 0 } = req.query;

  try {
    const conditions = [];
    const values = [];

    if (table) {
      values.push(table);
      conditions.push(`table_name = $${values.length}`);
    }
    if (operation) {
      values.push(operation.toUpperCase());
      conditions.push(`operation = $${values.length}`);
    }
    if (recordId) {
      values.push(recordId);
      conditions.push(`record_id = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(Math.min(parseInt(limit, 10) || 50, 100));
    const limitIdx = values.length;
    values.push(parseInt(offset, 10) || 0);
    const offsetIdx = values.length;

    const sql = `
      SELECT id, table_name, operation, record_id, old_data, new_data, diff_data, changed_by, changed_at
      FROM audit_logs
      ${whereClause}
      ORDER BY changed_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await query(sql, values);
    return res.json({
      count: result.rowCount,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      records: result.rows
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to query audit logs', details: err.message });
  }
}

async function createManualAuditLog(req, res) {
  const { tableName, operation, recordId, oldData, newData, changedBy } = req.body;

  if (!tableName || !operation || !recordId) {
    return res.status(400).json({
      error: 'Validation failed',
      details: 'tableName, operation, and recordId are required fields'
    });
  }

  try {
    const sql = `
      INSERT INTO audit_logs (table_name, operation, record_id, old_data, new_data, changed_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      tableName,
      operation.toUpperCase(),
      recordId,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      changedBy || 'application_service'
    ];

    const result = await query(sql, values);
    return res.status(201).json({ status: 'created', record: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record audit event', details: err.message });
  }
}

module.exports = {
  getHealth,
  listAuditLogs,
  createManualAuditLog,
};

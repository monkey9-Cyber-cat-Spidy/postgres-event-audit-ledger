const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as current_time');
    res.json({ status: 'healthy', db_time: result.rows[0].current_time });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

app.get('/api/audit-logs', async (req, res) => {
  const { table, limit = 50 } = req.query;
  try {
    let query = 'SELECT * FROM audit_logs';
    const params = [];
    if (table) {
      params.push(table);
      query += ` WHERE table_name = $1`;
    }
    query += ' ORDER BY changed_at DESC LIMIT $' + (params.length + 1);
    params.push(parseInt(limit));

    const result = await db.query(query, params);
    res.json({ logs: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Audit Ledger API listening on port ${PORT}`);
});

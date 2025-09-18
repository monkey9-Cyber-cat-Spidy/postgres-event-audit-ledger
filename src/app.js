const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { getHealth, listAuditLogs, createManualAuditLog } = require('./controllers/auditController');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Routes
app.get('/health', getHealth);
app.get('/api/audit-logs', listAuditLogs);
app.post('/api/audit-logs', createManualAuditLog);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[UNHANDLED ERROR]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

module.exports = app;

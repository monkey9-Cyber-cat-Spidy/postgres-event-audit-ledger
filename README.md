# PostgreSQL Event Audit Ledger

Production-grade audit logging microservice for compliance and event tracing. Captures change-data-capture (CDC) snapshots with before/after state diffs directly within **PostgreSQL** using native JSONB triggers and transactional isolation.

## Architecture
- **Engine**: Node.js, Express REST API
- **Database**: PostgreSQL with connection pooling via `pg.Pool`
- **Zero-Latency Overhead**: Auditing handled inside database transactions via PL/pgSQL triggers.

License: MIT

-- PostgreSQL Audit Logging Engine with Native JSONB CDC Triggers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Master Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(64) NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id VARCHAR(128) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    diff_data JSONB,
    changed_by VARCHAR(128) DEFAULT CURRENT_USER,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Sub-30ms Read Performance
CREATE INDEX IF NOT EXISTS idx_audit_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON audit_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_new_data_gin ON audit_logs USING gin (new_data);

-- PL/pgSQL Function Computing Diff and Recording Event
CREATE OR REPLACE FUNCTION process_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    diff_json JSONB;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, operation, record_id, old_data, changed_by)
        VALUES (TG_TABLE_NAME, 'DELETE', OLD.id::TEXT, to_jsonb(OLD), session_user);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Compute JSONB diff between old and new state
        SELECT jsonb_object_agg(n.key, jsonb_build_object('old', o.value, 'new', n.value))
        INTO diff_json
        FROM jsonb_each(to_jsonb(NEW)) n
        JOIN jsonb_each(to_jsonb(OLD)) o ON n.key = o.key
        WHERE n.value IS DISTINCT FROM o.value;

        INSERT INTO audit_logs (table_name, operation, record_id, old_data, new_data, diff_data, changed_by)
        VALUES (TG_TABLE_NAME, 'UPDATE', NEW.id::TEXT, to_jsonb(OLD), to_jsonb(NEW), diff_json, session_user);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (table_name, operation, record_id, new_data, changed_by)
        VALUES (TG_TABLE_NAME, 'INSERT', NEW.id::TEXT, to_jsonb(NEW), session_user);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration 0006: Add soft delete and audit log tables
-- Run after 0005_full_reference_schema.sql

-- Add deleted_at column to all core tables for soft delete
ALTER TABLE properties ADD COLUMN deleted_at TEXT;
ALTER TABLE suppliers ADD COLUMN deleted_at TEXT;
ALTER TABLE contacts ADD COLUMN deleted_at TEXT;
ALTER TABLE invoices ADD COLUMN deleted_at TEXT;
ALTER TABLE maintenance ADD COLUMN deleted_at TEXT;
ALTER TABLE documents ADD COLUMN deleted_at TEXT;
ALTER TABLE data_sources ADD COLUMN deleted_at TEXT;
ALTER TABLE budgets ADD COLUMN deleted_at TEXT;
ALTER TABLE bank_ledger ADD COLUMN deleted_at TEXT;
ALTER TABLE ledger_mapping ADD COLUMN deleted_at TEXT;
ALTER TABLE petty_cash_expenses ADD COLUMN deleted_at TEXT;
ALTER TABLE petty_cash_income ADD COLUMN deleted_at TEXT;
ALTER TABLE work_orders ADD COLUMN deleted_at TEXT;

-- Create indexes for soft delete queries
CREATE INDEX idx_properties_deleted_at ON properties(deleted_at);
CREATE INDEX idx_suppliers_deleted_at ON suppliers(deleted_at);
CREATE INDEX idx_contacts_deleted_at ON contacts(deleted_at);
CREATE INDEX idx_invoices_deleted_at ON invoices(deleted_at);
CREATE INDEX idx_maintenance_deleted_at ON maintenance(deleted_at);
CREATE INDEX idx_documents_deleted_at ON documents(deleted_at);
CREATE INDEX idx_data_sources_deleted_at ON data_sources(deleted_at);
CREATE INDEX idx_budgets_deleted_at ON budgets(deleted_at);
CREATE INDEX idx_bank_ledger_deleted_at ON bank_ledger(deleted_at);
CREATE INDEX idx_ledger_mapping_deleted_at ON ledger_mapping(deleted_at);
CREATE INDEX idx_petty_cash_expenses_deleted_at ON petty_cash_expenses(deleted_at);
CREATE INDEX idx_petty_cash_income_deleted_at ON petty_cash_income(deleted_at);
CREATE INDEX idx_work_orders_deleted_at ON work_orders(deleted_at);

-- Audit log table for all modifications
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE')),
  user_id TEXT,
  user_email TEXT,
  old_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);

-- Update existing views to filter out deleted records
-- (If any views exist, they would be recreated here)
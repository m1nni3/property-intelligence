-- Add audit tracking columns to all tables

ALTER TABLE properties ADD COLUMN created_by TEXT;
ALTER TABLE properties ADD COLUMN updated_by TEXT;

ALTER TABLE contacts ADD COLUMN created_by TEXT;
ALTER TABLE contacts ADD COLUMN updated_by TEXT;

ALTER TABLE suppliers ADD COLUMN created_by TEXT;
ALTER TABLE suppliers ADD COLUMN updated_by TEXT;

ALTER TABLE invoices ADD COLUMN created_by TEXT;
ALTER TABLE invoices ADD COLUMN updated_by TEXT;

ALTER TABLE maintenance ADD COLUMN created_by TEXT;
ALTER TABLE maintenance ADD COLUMN updated_by TEXT;

ALTER TABLE documents ADD COLUMN created_by TEXT;
ALTER TABLE documents ADD COLUMN updated_by TEXT;

ALTER TABLE property_files ADD COLUMN created_by TEXT;
ALTER TABLE property_files ADD COLUMN updated_by TEXT;

-- Create index on user_id in audit_log
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);

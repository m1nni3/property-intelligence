-- Full Reference Schema Alignment
-- Adds all missing tables from the property management schema reference

-- Add columns to existing properties
ALTER TABLE properties ADD COLUMN scheme_name TEXT;
ALTER TABLE properties ADD COLUMN unit_count INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));

-- Add role column to contacts
ALTER TABLE contacts ADD COLUMN role TEXT;

-- ===== FINANCIAL LEDGERS =====

CREATE TABLE IF NOT EXISTS bank_ledger (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  date TEXT,
  description TEXT,
  debit REAL DEFAULT 0,
  credit REAL DEFAULT 0,
  balance REAL DEFAULT 0,
  reference TEXT,
  category TEXT,
  imported_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS levy_ledger (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  date TEXT,
  description TEXT,
  debit REAL DEFAULT 0,
  credit REAL DEFAULT 0,
  balance REAL DEFAULT 0,
  reference TEXT,
  category TEXT,
  imported_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS municipality_ledger (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  date TEXT,
  description TEXT,
  debit REAL DEFAULT 0,
  credit REAL DEFAULT 0,
  balance REAL DEFAULT 0,
  reference TEXT,
  category TEXT,
  imported_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rental_ledger (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  date TEXT,
  description TEXT,
  debit REAL DEFAULT 0,
  credit REAL DEFAULT 0,
  balance REAL DEFAULT 0,
  reference TEXT,
  category TEXT,
  imported_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS petty_cash_expenses (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  date TEXT,
  description TEXT,
  amount REAL DEFAULT 0,
  category TEXT,
  vat_inclusive INTEGER DEFAULT 0,
  supplier TEXT,
  receipt_url TEXT,
  notes TEXT,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS petty_cash_income (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  date TEXT,
  description TEXT,
  amount REAL DEFAULT 0,
  category TEXT,
  receipt_url TEXT,
  notes TEXT,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- ===== UNITS & MAINTENANCE =====

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  unit_number TEXT,
  tenant_name TEXT,
  tenant_phone TEXT,
  tenant_email TEXT,
  monthly_rental REAL DEFAULT 0,
  deposit REAL DEFAULT 0,
  lease_start TEXT,
  lease_end TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS work_orders (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  unit_id TEXT,
  contractor_id TEXT,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK(status IN ('open','in_progress','completed','cancelled')),
  urgency TEXT DEFAULT 'routine' CHECK(urgency IN ('routine','urgent','emergency')),
  liability TEXT,
  cost_estimate REAL,
  actual_cost REAL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
);

-- ===== PROPERTY METADATA =====

CREATE TABLE IF NOT EXISTS property_details (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  unit_number TEXT,
  door_number TEXT,
  erf_number TEXT,
  scheme_number TEXT,
  size_sqm REAL,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  parking_bays INTEGER DEFAULT 0,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS property_documents (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  name TEXT,
  category TEXT,
  file_url TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- ===== INSURANCE & BONDS =====

CREATE TABLE IF NOT EXISTS insurance_policies (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  insurer TEXT,
  broker TEXT,
  policy_number TEXT,
  policy_holder TEXT,
  coverage_amount REAL,
  excess REAL,
  premium REAL,
  renewal_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bonds (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  bank TEXT,
  account_number TEXT,
  original_amount REAL,
  monthly_payment REAL,
  expected_payoff_date TEXT,
  payment_method TEXT,
  provider_name TEXT,
  provider_phone TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- ===== BUDGETS & RULES =====

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  year INTEGER,
  month INTEGER CHECK(month BETWEEN 1 AND 12),
  category TEXT,
  budget_amount REAL DEFAULT 0,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ledger_mapping (
  id TEXT PRIMARY KEY,
  property_id TEXT,
  ledger_type TEXT,
  pattern TEXT,
  category TEXT,
  priority INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

-- ===== RECONCILIATION =====

CREATE TABLE IF NOT EXISTS reconciliation (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  period TEXT,
  ledger_type TEXT,
  ledger_amount REAL DEFAULT 0,
  bank_amount REAL DEFAULT 0,
  variance REAL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK(status IN ('matched','unmatched','exception','pending')),
  notes TEXT,
  resolved_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- ===== HISTORY & VALUATIONS =====

CREATE TABLE IF NOT EXISTS property_history (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  event_type TEXT CHECK(event_type IN ('purchase','inspection','lease','maintenance','valuation','note')),
  title TEXT,
  description TEXT,
  event_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS valuation_history (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  value REAL,
  date TEXT,
  source TEXT CHECK(source IN ('municipal','bank','agent')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- ===== CATEGORIES ENUM TABLE =====

CREATE TABLE IF NOT EXISTS categories (
  name TEXT PRIMARY KEY,
  type TEXT
);

INSERT OR IGNORE INTO categories (name, type) VALUES
  ('Rental Income', 'income'),
  ('Levy Income', 'income'),
  ('Levy Payment', 'expense'),
  ('Bank Fee', 'expense'),
  ('Bank Charge', 'expense'),
  ('Municipal Rates', 'expense'),
  ('Municipal Charges', 'expense'),
  ('Maintenance', 'expense'),
  ('Insurance', 'expense'),
  ('Utilities', 'expense');

-- ===== INDEXES =====

CREATE INDEX IF NOT EXISTS idx_bank_ledger_property ON bank_ledger(property_id);
CREATE INDEX IF NOT EXISTS idx_bank_ledger_date ON bank_ledger(date);
CREATE INDEX IF NOT EXISTS idx_levy_ledger_property ON levy_ledger(property_id);
CREATE INDEX IF NOT EXISTS idx_municipality_ledger_property ON municipality_ledger(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_ledger_property ON rental_ledger(property_id);
CREATE INDEX IF NOT EXISTS idx_petty_cash_exp_property ON petty_cash_expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_petty_cash_inc_property ON petty_cash_income(property_id);
CREATE INDEX IF NOT EXISTS idx_units_property ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_property ON work_orders(property_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_unit ON work_orders(unit_id);
CREATE INDEX IF NOT EXISTS idx_property_details_property ON property_details(property_id);
CREATE INDEX IF NOT EXISTS idx_insurance_property ON insurance_policies(property_id);
CREATE INDEX IF NOT EXISTS idx_bonds_property ON bonds(property_id);
CREATE INDEX IF NOT EXISTS idx_budgets_property ON budgets(property_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(year, month);
CREATE INDEX IF NOT EXISTS idx_ledger_mapping_property ON ledger_mapping(property_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_property ON reconciliation(property_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_period ON reconciliation(period);
CREATE INDEX IF NOT EXISTS idx_property_history_property ON property_history(property_id);
CREATE INDEX IF NOT EXISTS idx_valuation_history_property ON valuation_history(property_id);

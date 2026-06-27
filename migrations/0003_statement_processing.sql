-- Statement & Document Intelligence

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  property_id TEXT,
  filename TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER,
  file_path TEXT,
  status TEXT DEFAULT 'uploaded' CHECK(status IN ('uploaded','processing','processed','failed')),
  category TEXT,
  extracted_text TEXT,
  processed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS statements (
  id TEXT PRIMARY KEY,
  document_id TEXT,
  property_id TEXT,
  statement_type TEXT CHECK(statement_type IN ('municipal','bank','owner','tenant','insurance','other')),
  reference_number TEXT,
  period_start TEXT,
  period_end TEXT,
  issue_date TEXT,
  total_amount REAL,
  currency TEXT DEFAULT 'ZAR',
  raw_text TEXT,
  parsed_json TEXT,
  status TEXT DEFAULT 'parsed',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS statement_line_items (
  id TEXT PRIMARY KEY,
  statement_id TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  category TEXT,
  quantity REAL,
  unit_price REAL,
  date TEXT,
  is_debit INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (statement_id) REFERENCES statements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_documents_property ON documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_statements_document ON statements(document_id);
CREATE INDEX IF NOT EXISTS idx_statements_property ON statements(property_id);
CREATE INDEX IF NOT EXISTS idx_statements_type ON statements(statement_type);
CREATE INDEX IF NOT EXISTS idx_line_items_statement ON statement_line_items(statement_id);

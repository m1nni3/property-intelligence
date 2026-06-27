-- Data Acquisition Framework — portal registry, connectors, sync

CREATE TABLE IF NOT EXISTS data_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('municipal','insurance','bank','utility','government','other')),
  connector_type TEXT NOT NULL DEFAULT 'http' CHECK(connector_type IN ('http','browser','file','custom')),
  base_url TEXT,
  config TEXT,
  is_active INTEGER DEFAULT 1,
  last_sync_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS data_source_credentials (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  credential_key TEXT NOT NULL,
  credential_value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','running','completed','failed')),
  started_at TEXT,
  completed_at TEXT,
  items_fetched INTEGER DEFAULT 0,
  items_processed INTEGER DEFAULT 0,
  error_message TEXT,
  cursor TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS synced_data (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  sync_run_id TEXT,
  external_id TEXT,
  entity_type TEXT NOT NULL,
  raw_data TEXT,
  normalized_data TEXT,
  checksum TEXT,
  synced_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE CASCADE,
  FOREIGN KEY (sync_run_id) REFERENCES sync_runs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sources_type ON data_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_sources_active ON data_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_sync_runs_source ON sync_runs(source_id);
CREATE INDEX IF NOT EXISTS idx_sync_runs_status ON sync_runs(status);
CREATE INDEX IF NOT EXISTS idx_synced_data_source ON synced_data(source_id);
CREATE INDEX IF NOT EXISTS idx_synced_data_external ON synced_data(external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_synced_data_source_ext ON synced_data(source_id, external_id);

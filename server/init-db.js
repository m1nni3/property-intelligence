import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { runMigration, runSeed } from "./lib/migrate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });

const dbPath = join(dataDir, "property-intelligence.db");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode=WAL");
db.exec("PRAGMA foreign_keys=ON");

runMigration(db, join(__dirname, "..", "migrations", "0001_core_domain.sql"), "0001");
runMigration(db, join(__dirname, "..", "migrations", "0003_statement_processing.sql"), "0003");
runMigration(db, join(__dirname, "..", "migrations", "0004_data_acquisition.sql"), "0004");
runMigration(db, join(__dirname, "..", "migrations", "0005_full_reference_schema.sql"), "0005");
runSeed(db, join(__dirname, "..", "migrations", "0002_seed.sql"));

db.close();
console.log(`Database created at ${dbPath}`);

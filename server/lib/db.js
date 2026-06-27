import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "..", "..", "data", "property-intelligence.db");

export const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode=WAL");
db.exec("PRAGMA foreign_keys=ON");

export function prepare(sql, ...params) {
  const stmt = db.prepare(sql);
  const isQuery = /^\s*(SELECT|RETURNING)/i.test(sql);
  return {
    all: () => stmt.all(...params),
    first: () => stmt.get(...params) || null,
    run: () => { stmt.run(...params); return { changes: stmt.changes }; },
  };
}

export function id() {
  return randomUUID();
}

export function json(data, status = 200) {
  return { status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) };
}

export function error(msg, status = 400) {
  return json({ error: msg }, status);
}

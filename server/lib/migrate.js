import { readFileSync } from "node:fs";
import { join } from "node:path";

export function runMigration(db, filePath, label) {
  const sql = readFileSync(filePath, "utf-8");
  let count = 0;
  let skipped = 0;
  for (const raw of sql.split(";")) {
    const stmt = raw.trim();
    if (!stmt) continue;
    try {
      db.exec(stmt + ";");
      count++;
    } catch {
      skipped++;
    }
  }
  console.log(`Migration ${label}: ${count} applied, ${skipped} skipped`);
}

export function runOptionalMigration(db, filePath, label) {
  try {
    return runMigration(db, filePath, label);
  } catch (e) {
    console.log(`Migration ${label} skipped:`, e.message);
  }
}

export function runSeed(db, filePath) {
  try {
    const sql = readFileSync(filePath, "utf-8");
    db.exec(sql);
    console.log(`Seed applied from ${filePath.split("/").pop()}`);
  } catch {
    console.log("No seed data applied");
  }
}

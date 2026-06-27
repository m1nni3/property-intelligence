import { randomUUID } from "node:crypto";
import { getConnector } from "./registry.js";
import { prepare } from "../lib/db.js";

export class SyncEngine {
  async syncSource(source) {
    const runId = randomUUID();
    prepare(
      "INSERT INTO sync_runs (id, source_id, status, started_at) VALUES (?, ?, 'running', datetime('now'))",
      runId, source.id,
    ).run();

    try {
      const connector = getConnector(source);
      await connector.connect();

      let cursor = null;
      let totalFetched = 0;
      let totalProcessed = 0;
      let page = 0;
      const maxPages = this.getMaxPages(source);

      do {
        const result = await connector.fetch(cursor);
        const records = result.records || [];
        cursor = result.cursor;

        for (const record of records) {
          totalFetched++;
          const normalized = connector.normalize(record);
          const checksum = this.checksum(record);

          const existing = prepare(
            "SELECT id FROM synced_data WHERE source_id = ? AND external_id = ?",
            source.id, record.id || record.external_id || `record-${totalFetched}`,
          ).first();

          if (existing) {
            prepare(
              "UPDATE synced_data SET raw_data = ?, normalized_data = ?, checksum = ?, sync_run_id = ?, synced_at = datetime('now') WHERE id = ?",
              JSON.stringify(record), JSON.stringify(normalized), checksum, runId, existing.id,
            ).run();
          } else {
            prepare(
              "INSERT INTO synced_data (id, source_id, sync_run_id, external_id, entity_type, raw_data, normalized_data, checksum) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
              randomUUID(), source.id, runId,
              record.id || record.external_id || `record-${totalFetched}`,
              record.type || record.entity_type || "unknown",
              JSON.stringify(record), JSON.stringify(normalized), checksum,
            ).run();
          }
          totalProcessed++;
        }

        page++;
      } while (cursor && page < maxPages);

      await connector.disconnect();

      prepare(
        "UPDATE sync_runs SET status = 'completed', completed_at = datetime('now'), items_fetched = ?, items_processed = ?, cursor = ? WHERE id = ?",
        totalFetched, totalProcessed, cursor, runId,
      ).run();

      prepare(
        "UPDATE data_sources SET last_sync_at = datetime('now') WHERE id = ?",
        source.id,
      ).run();

      return { runId, status: "completed", fetched: totalFetched, processed: totalProcessed };
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      prepare(
        "UPDATE sync_runs SET status = 'failed', completed_at = datetime('now'), error_message = ? WHERE id = ?",
        errMsg, runId,
      ).run();
      return { runId, status: "failed", error: errMsg };
    }
  }

  async syncAll() {
    const sources = prepare(
      "SELECT * FROM data_sources WHERE is_active = 1 ORDER BY name",
    ).all();

    const results = [];
    for (const source of sources) {
      const result = await this.syncSource(source);
      results.push({ source: source.name, ...result });
    }
    return results;
  }

  getMaxPages(source) {
    try {
      const config = source.config ? JSON.parse(source.config) : {};
      return config.max_pages || 10;
    } catch {
      return 10;
    }
  }

  checksum(data) {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return String(hash);
  }
}

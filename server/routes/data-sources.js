import { prepare, id, json, error } from "../lib/db.js";
import { parseBody } from "../lib/parse-body.js";

export function registerDataSourceRoutes(router) {
  router["GET /api/data-sources"] = () => {
    const rows = prepare(
      "SELECT id, name, source_type, connector_type, base_url, is_active, last_sync_at, created_at FROM data_sources ORDER BY name"
    ).all();
    return json(rows);
  };

  router["GET /api/data-sources/:id"] = (req, id) => {
    const row = prepare("SELECT * FROM data_sources WHERE id = ?", id).first();
    if (!row) return error("Data source not found", 404);
    if (row.config) row.config = JSON.parse(row.config);
    return json(row);
  };

  router["POST /api/data-sources"] = async (req) => {
    const body = await parseBody(req);
    if (!body.name || !body.source_type) return error("name and source_type are required");
    const uid = id();
    prepare(
      "INSERT INTO data_sources (id, name, source_type, connector_type, base_url, config) VALUES (?, ?, ?, ?, ?, ?)",
      uid, body.name, body.source_type, body.connector_type || "http",
      body.base_url || null, body.config ? JSON.stringify(body.config) : null,
    ).run();
    return json(prepare("SELECT * FROM data_sources WHERE id = ?", uid).first(), 201);
  };

  router["PATCH /api/data-sources/:id"] = async (req, id) => {
    const existing = prepare("SELECT * FROM data_sources WHERE id = ?", id).first();
    if (!existing) return error("Data source not found", 404);
    const body = await parseBody(req);
    prepare(
      "UPDATE data_sources SET name = ?, source_type = ?, connector_type = ?, base_url = ?, config = ?, is_active = ? WHERE id = ?",
      body.name ?? existing.name, body.source_type ?? existing.source_type,
      body.connector_type ?? existing.connector_type, body.base_url ?? existing.base_url,
      body.config ? JSON.stringify(body.config) : existing.config,
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : existing.is_active,
      id,
    ).run();
    return json(prepare("SELECT * FROM data_sources WHERE id = ?", id).first());
  };

  router["DELETE /api/data-sources/:id"] = (req, id) => {
    const existing = prepare("SELECT * FROM data_sources WHERE id = ?", id).first();
    if (!existing) return error("Data source not found", 404);
    prepare("DELETE FROM data_sources WHERE id = ?", id).run();
    return json({ deleted: true });
  };

  router["POST /api/data-sources/:id/sync"] = async (req, id) => {
    const source = prepare("SELECT * FROM data_sources WHERE id = ?", id).first();
    if (!source) return error("Data source not found", 404);
    const { SyncEngine } = await import("../../connectors/sync-engine.js");
    const engine = new SyncEngine();
    const result = await engine.syncSource(source);
    return json(result);
  };

  router["POST /api/sync/all"] = async () => {
    const { SyncEngine } = await import("../../connectors/sync-engine.js");
    const engine = new SyncEngine();
    const results = await engine.syncAll();
    return json(results);
  };

  router["GET /api/sync-runs"] = (req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sourceId = url.searchParams.get("source_id");
    let rows;
    if (sourceId) {
      rows = prepare("SELECT * FROM sync_runs WHERE source_id = ? ORDER BY created_at DESC LIMIT 50", sourceId).all();
    } else {
      rows = prepare("SELECT * FROM sync_runs ORDER BY created_at DESC LIMIT 50").all();
    }
    return json(rows);
  };

  router["GET /api/sync-runs/:id"] = (req, id) => {
    const row = prepare("SELECT * FROM sync_runs WHERE id = ?", id).first();
    if (!row) return error("Sync run not found", 404);
    return json(row);
  };
}

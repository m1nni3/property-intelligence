import { prepare, id, json, error } from "../lib/db.js";
import { parseBody } from "../lib/parse-body.js";

export function registerMaintenanceRoutes(router) {
  router["GET /api/maintenance"] = () => {
    return json(prepare("SELECT * FROM maintenance ORDER BY created_at DESC").all());
  };

  router["POST /api/maintenance"] = async (req) => {
    const body = await parseBody(req);
    if (!body.property_id || !body.title) return error("property_id and title are required");
    const uid = id();
    prepare(
      "INSERT INTO maintenance (id, property_id, title, description, status, priority, assigned_to, cost_estimate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      uid, body.property_id, body.title, body.description || null,
      body.status || "open", body.priority || "medium", body.assigned_to || null, body.cost_estimate || null,
    ).run();
    return json(prepare("SELECT * FROM maintenance WHERE id = ?", uid).first(), 201);
  };

  router["PATCH /api/maintenance/:id"] = async (req, id) => {
    const existing = prepare("SELECT * FROM maintenance WHERE id = ?", id).first();
    if (!existing) return error("Maintenance not found", 404);
    const body = await parseBody(req);
    prepare(
      "UPDATE maintenance SET property_id = ?, title = ?, description = ?, status = ?, priority = ?, assigned_to = ?, cost_estimate = ? WHERE id = ?",
      body.property_id ?? existing.property_id, body.title ?? existing.title,
      body.description ?? existing.description, body.status ?? existing.status,
      body.priority ?? existing.priority, body.assigned_to ?? existing.assigned_to,
      body.cost_estimate ?? existing.cost_estimate, id,
    ).run();
    return json(prepare("SELECT * FROM maintenance WHERE id = ?", id).first());
  };

  router["DELETE /api/maintenance/:id"] = (req, id) => {
    const existing = prepare("SELECT * FROM maintenance WHERE id = ?", id).first();
    if (!existing) return error("Maintenance not found", 404);
    prepare("DELETE FROM maintenance WHERE id = ?", id).run();
    return json({ deleted: true });
  };

  router["GET /api/suppliers"] = () => {
    return json(prepare("SELECT * FROM suppliers ORDER BY name").all());
  };

  router["POST /api/suppliers"] = async (req) => {
    const body = await parseBody(req);
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) return error("name is required");
    const uid = id();
    prepare(
      "INSERT INTO suppliers (id, name, service_type, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)",
      uid, body.name.trim(), body.service_type || null, body.phone || null, body.email || null, body.address || null,
    ).run();
    return json(prepare("SELECT * FROM suppliers WHERE id = ?", uid).first(), 201);
  };

  router["PATCH /api/suppliers/:id"] = async (req, id) => {
    const existing = prepare("SELECT * FROM suppliers WHERE id = ?", id).first();
    if (!existing) return error("Supplier not found", 404);
    const body = await parseBody(req);
    prepare(
      "UPDATE suppliers SET name = ?, service_type = ?, phone = ?, email = ?, address = ? WHERE id = ?",
      body.name ?? existing.name, body.service_type ?? existing.service_type,
      body.phone ?? existing.phone, body.email ?? existing.email,
      body.address ?? existing.address, id,
    ).run();
    return json(prepare("SELECT * FROM suppliers WHERE id = ?", id).first());
  };

  router["DELETE /api/suppliers/:id"] = (req, id) => {
    const existing = prepare("SELECT * FROM suppliers WHERE id = ?", id).first();
    if (!existing) return error("Supplier not found", 404);
    prepare("DELETE FROM suppliers WHERE id = ?", id).run();
    return json({ deleted: true });
  };
}

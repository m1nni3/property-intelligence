import { prepare, id, json, error } from "../lib/db.js";
import { parseBody } from "../lib/parse-body.js";

export function registerCoreRoutes(router) {
  router["GET /api/health"] = () => json({ status: "ok", environment: process.env.NODE_ENV || "development" });

  router["GET /api/properties"] = () => {
    return json(prepare("SELECT * FROM properties ORDER BY created_at DESC").all());
  };

  router["POST /api/properties"] = async (req) => {
    const body = await parseBody(req);
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) return error("name is required");
    const uid = id();
    prepare(
      "INSERT INTO properties (id, name, address, type, status) VALUES (?, ?, ?, ?, ?)",
      uid, body.name.trim(), body.address || null, body.type || "residential", body.status || "active",
    ).run();
    return json(prepare("SELECT * FROM properties WHERE id = ?", uid).first(), 201);
  };

  router["GET /api/properties/:id"] = (req, id) => {
    const row = prepare("SELECT * FROM properties WHERE id = ?", id).first();
    if (!row) return error("Property not found", 404);
    return json(row);
  };

  router["PATCH /api/properties/:id"] = async (req, id) => {
    const existing = prepare("SELECT * FROM properties WHERE id = ?", id).first();
    if (!existing) return error("Property not found", 404);
    const body = await parseBody(req);
    prepare(
      "UPDATE properties SET name = ?, address = ?, type = ?, status = ?, updated_at = datetime('now') WHERE id = ?",
      body.name ?? existing.name, body.address ?? existing.address,
      body.type ?? existing.type, body.status ?? existing.status, id,
    ).run();
    return json(prepare("SELECT * FROM properties WHERE id = ?", id).first());
  };

  router["DELETE /api/properties/:id"] = (req, id) => {
    const existing = prepare("SELECT * FROM properties WHERE id = ?", id).first();
    if (!existing) return error("Property not found", 404);
    prepare("DELETE FROM properties WHERE id = ?", id).run();
    return json({ deleted: true });
  };

  router["GET /api/properties/:id/contacts"] = (req, id) => {
    const rows = prepare(
      "SELECT c.*, pc.role FROM property_contacts pc JOIN contacts c ON c.id = pc.contact_id WHERE pc.property_id = ?",
      id,
    ).all();
    return json(rows);
  };

  router["POST /api/properties/:id/contacts"] = async (req, id) => {
    const body = await parseBody(req);
    if (!body.contact_id || !body.role) return error("contact_id and role are required");
    prepare(
      "INSERT INTO property_contacts (property_id, contact_id, role) VALUES (?, ?, ?)",
      id, body.contact_id, body.role,
    ).run();
    return json({ created: true }, 201);
  };

  router["GET /api/contacts"] = () => {
    return json(prepare("SELECT * FROM contacts ORDER BY name").all());
  };

  router["POST /api/contacts"] = async (req) => {
    const body = await parseBody(req);
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) return error("name is required");
    const uid = id();
    prepare(
      "INSERT INTO contacts (id, name, phone, email, company, notes) VALUES (?, ?, ?, ?, ?, ?)",
      uid, body.name.trim(), body.phone || null, body.email || null, body.company || null, body.notes || null,
    ).run();
    return json(prepare("SELECT * FROM contacts WHERE id = ?", uid).first(), 201);
  };

  router["PATCH /api/contacts/:id"] = async (req, id) => {
    const existing = prepare("SELECT * FROM contacts WHERE id = ?", id).first();
    if (!existing) return error("Contact not found", 404);
    const body = await parseBody(req);
    prepare(
      "UPDATE contacts SET name = ?, phone = ?, email = ?, company = ?, notes = ? WHERE id = ?",
      body.name ?? existing.name, body.phone ?? existing.phone, body.email ?? existing.email,
      body.company ?? existing.company, body.notes ?? existing.notes, id,
    ).run();
    return json(prepare("SELECT * FROM contacts WHERE id = ?", id).first());
  };

  router["DELETE /api/contacts/:id"] = (req, id) => {
    const existing = prepare("SELECT * FROM contacts WHERE id = ?", id).first();
    if (!existing) return error("Contact not found", 404);
    prepare("DELETE FROM contacts WHERE id = ?", id).run();
    return json({ deleted: true });
  };

  router["GET /api/categories"] = () => {
    return json(prepare("SELECT * FROM categories ORDER BY name ASC").all());
  };
}

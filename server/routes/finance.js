import { prepare, id, json, error } from "../lib/db.js";
import { parseBody } from "../lib/parse-body.js";

export function registerFinanceRoutes(router) {
  router["GET /api/invoices"] = () => {
    return json(prepare("SELECT * FROM invoices ORDER BY created_at DESC").all());
  };

  router["POST /api/invoices"] = async (req) => {
    const body = await parseBody(req);
    if (!body.property_id) return error("property_id is required");
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0) return error("amount must be a valid positive number");
    const uid = id();
    prepare(
      "INSERT INTO invoices (id, property_id, supplier_id, amount, currency, due_date, status, description, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      uid, body.property_id, body.supplier_id || null, amount, body.currency || "ZAR",
      body.due_date || null, body.status || "pending", body.description || null, body.category || null,
    ).run();
    return json(prepare("SELECT * FROM invoices WHERE id = ?", uid).first(), 201);
  };

  router["PATCH /api/invoices/:id"] = async (req, id) => {
    const existing = prepare("SELECT * FROM invoices WHERE id = ?", id).first();
    if (!existing) return error("Invoice not found", 404);
    const body = await parseBody(req);
    prepare(
      "UPDATE invoices SET property_id = ?, supplier_id = ?, amount = ?, currency = ?, due_date = ?, status = ?, description = ?, category = ? WHERE id = ?",
      body.property_id ?? existing.property_id, body.supplier_id ?? existing.supplier_id,
      body.amount ?? existing.amount, body.currency ?? existing.currency,
      body.due_date ?? existing.due_date, body.status ?? existing.status,
      body.description ?? existing.description, body.category ?? existing.category, id,
    ).run();
    return json(prepare("SELECT * FROM invoices WHERE id = ?", id).first());
  };

  router["DELETE /api/invoices/:id"] = (req, id) => {
    const existing = prepare("SELECT * FROM invoices WHERE id = ?", id).first();
    if (!existing) return error("Invoice not found", 404);
    prepare("DELETE FROM invoices WHERE id = ?", id).run();
    return json({ deleted: true });
  };
}

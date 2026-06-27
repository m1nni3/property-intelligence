import { prepare, id, json, error } from "../lib/db.js";
import { parseBody } from "../lib/parse-body.js";

export function registerCrud(router, table, columns, opts = {}) {
  const route = opts.route || table.replace(/_/g, "-");
  const orderBy = opts.orderBy || "created_at DESC";
  const cols = columns.join(", ");
  const ph = columns.map(() => "?").join(", ");
  const sets = columns.map((c) => `${c} = ?`).join(", ");

  router[`GET /api/${route}`] = () => json(prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`).all());
  router[`GET /api/${route}/:id`] = (req, id) => {
    const row = prepare(`SELECT * FROM ${table} WHERE id = ?`, id).first();
    return row ? json(row) : error("Not found", 404);
  };
  router[`POST /api/${route}`] = async (req) => {
    const body = await parseBody(req);
    const uid = id();
    prepare(`INSERT INTO ${table} (id, ${cols}) VALUES (?, ${ph})`, uid, ...columns.map((c) => body[c] ?? null)).run();
    return json(prepare(`SELECT * FROM ${table} WHERE id = ?`, uid).first(), 201);
  };
  router[`PATCH /api/${route}/:id`] = async (req, id) => {
    const existing = prepare(`SELECT * FROM ${table} WHERE id = ?`, id).first();
    if (!existing) return error("Not found", 404);
    const body = await parseBody(req);
    prepare(`UPDATE ${table} SET ${sets} WHERE id = ?`, ...columns.map((c) => body[c] ?? existing[c]), id).run();
    return json(prepare(`SELECT * FROM ${table} WHERE id = ?`, id).first());
  };
  router[`DELETE /api/${route}/:id`] = (req, id) => {
    if (!prepare(`SELECT * FROM ${table} WHERE id = ?`, id).first()) return error("Not found", 404);
    prepare(`DELETE FROM ${table} WHERE id = ?`, id).run();
    return json({ deleted: true });
  };
}

export function registerCrudTables(router) {
  const ledgerCols = ["property_id", "date", "description", "debit", "credit", "balance", "reference", "category", "imported_at"];
  registerCrud(router, "bank_ledger", ledgerCols, { orderBy: "date DESC" });
  registerCrud(router, "levy_ledger", ledgerCols, { orderBy: "date DESC" });
  registerCrud(router, "municipality_ledger", ledgerCols, { orderBy: "date DESC" });
  registerCrud(router, "rental_ledger", ledgerCols, { orderBy: "date DESC" });

  registerCrud(router, "petty_cash_expenses", ["property_id", "date", "description", "amount", "category", "vat_inclusive", "supplier", "receipt_url", "notes"], { orderBy: "date DESC" });
  registerCrud(router, "petty_cash_income", ["property_id", "date", "description", "amount", "category", "receipt_url", "notes"], { orderBy: "date DESC" });

  registerCrud(router, "units", ["property_id", "unit_number", "tenant_name", "tenant_phone", "tenant_email", "monthly_rental", "deposit", "lease_start", "lease_end"], { orderBy: "unit_number ASC" });
  registerCrud(router, "work_orders", ["property_id", "unit_id", "contractor_id", "description", "status", "urgency", "liability", "cost_estimate", "actual_cost"], { orderBy: "created_at DESC" });
  registerCrud(router, "property_details", ["property_id", "unit_number", "door_number", "erf_number", "scheme_number", "size_sqm", "bedrooms", "bathrooms", "parking_bays"], { orderBy: "unit_number ASC" });
  registerCrud(router, "property_documents", ["property_id", "name", "category", "file_url", "mime_type", "size_bytes", "notes"], { orderBy: "created_at DESC" });
  registerCrud(router, "insurance_policies", ["property_id", "insurer", "broker", "policy_number", "policy_holder", "coverage_amount", "excess", "premium", "renewal_date"], { orderBy: "renewal_date ASC" });
  registerCrud(router, "bonds", ["property_id", "bank", "account_number", "original_amount", "monthly_payment", "expected_payoff_date", "payment_method", "provider_name", "provider_phone"]);
  registerCrud(router, "budgets", ["property_id", "year", "month", "category", "budget_amount"], { orderBy: "year DESC, month DESC" });
  registerCrud(router, "ledger_mapping", ["property_id", "ledger_type", "pattern", "category", "priority", "is_active"], { orderBy: "priority ASC" });
  registerCrud(router, "reconciliation", ["property_id", "period", "ledger_type", "ledger_amount", "bank_amount", "variance", "status", "notes", "resolved_at"], { orderBy: "period DESC" });
  registerCrud(router, "property_history", ["property_id", "event_type", "title", "description", "event_date"], { orderBy: "event_date DESC" });
  registerCrud(router, "valuation_history", ["property_id", "value", "date", "source", "notes"], { orderBy: "date DESC" });
}

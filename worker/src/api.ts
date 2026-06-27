import { json, error, uuid, notFound } from "./utils";
import type { Env } from "./index";

export async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, "") || "/";
  const method = request.method;

  try {
    if (path === "/health" && method === "GET") {
      return json({ status: "ok", environment: env.ENVIRONMENT });
    }

    return routeEntities(path, method, request, env);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Internal error", 500);
  }
}

const ENTITY_TABLES: Record<string, string> = {
  properties: "properties",
  suppliers: "suppliers",
  contacts: "contacts",
  invoices: "invoices",
  maintenance: "maintenance",
  documents: "documents",
  "data-sources": "data_sources",
  pl: "budgets",
  "pl-monthly": "bank_ledger",
  "pl-entries": "ledger_mapping",
  "petty-cash-expenses": "petty_cash_expenses",
  "petty-cash-income": "petty_cash_income",
  tasks: "work_orders",
};

const ENTITY_VALID_COLUMNS: Record<string, string[]> = {
  properties: ["name", "address", "type", "status"],
  suppliers: ["name", "email", "phone", "company"],
  contacts: ["name", "email", "phone", "role", "company"],
  invoices: ["property_id", "supplier_id", "amount", "status", "due_date", "description"],
  maintenance: ["property_id", "title", "description", "priority", "status", "assigned_to"],
  documents: ["property_id", "name", "type", "url", "description"],
  "data-sources": ["name", "type", "url", "status", "config"],
  pl: ["property_id", "year", "category", "budget_amount", "actual_override"],
  "pl-monthly": ["property_id", "year", "month", "category_key", "amount"],
  "pl-entries": ["property_id", "year", "month", "category_key", "amount", "description", "deducted_expenses"],
  tasks: ["title", "description", "priority", "status", "due_date", "assigned_to"],
};

function getTable(entity: string): string {
  return ENTITY_TABLES[entity] || entity;
}

async function routeEntities(
  path: string,
  method: string,
  request: Request,
  env: Env,
): Promise<Response> {
  const match = path.match(
    /^\/(properties|suppliers|contacts|invoices|maintenance|documents|data-sources|pl|pl-monthly|pl-entries|petty-cash-expenses|petty-cash-income|tasks)(?:\/([^/]+))?(?:\/([^/]+))?$/,
  );

  if (!match) {
    return notFound(`Unknown route: ${path}`);
  }

  const entity = match[1];
  const id = match[2];
  const sub = match[3];

  if (!id) {
    if (entity === "petty-cash-expenses" || entity === "petty-cash-income") {
      if (method === "GET") return listEntities(entity, env, request);
      if (method === "POST") return createEntity(entity, request, env);
      return error("Method not allowed", 405);
    }
    if (entity === "pl") {
      if (method === "GET") return listEntities(entity, env, request);
      if (method === "POST") return createEntity(entity, request, env);
      return error("Method not allowed", 405);
    }
    if (entity === "pl-monthly") {
      if (method === "GET") return listEntities(entity, env, request);
      return error("Method not allowed", 405);
    }
    if (entity === "pl-entries") {
      if (method === "GET") return listEntities(entity, env, request);
      if (method === "POST") return createEntity(entity, request, env);
      return error("Method not allowed", 405);
    }
    if (entity === "tasks") {
      if (method === "GET") return listEntities(entity, env, request);
      if (method === "POST") return createEntity(entity, request, env);
      return error("Method not allowed", 405);
    }
    if (method === "GET") return listEntities(entity, env);
    if (method === "POST") return createEntity(entity, request, env);
    return error("Method not allowed", 405);
  }

  if (!sub) {
    if (method === "GET") return getEntity(entity, id, env);
    if (method === "PATCH" || method === "PUT") return updateEntity(entity, id, request, env);
    if (method === "DELETE") return deleteEntity(entity, id, env);
    return error("Method not allowed", 405);
  }

  if (entity === "properties") {
    if (sub === "contacts") {
      if (method === "GET") return listPropertyContacts(id, env);
      if (method === "POST") return addPropertyContact(id, request, env);
      return error("Method not allowed", 405);
    }
    if (sub === "files") {
      if (method === "GET") return listPropertyFiles(id, env);
      if (method === "POST") return uploadPropertyFile(id, request, env);
      return error("Method not allowed", 405);
    }
  }

  return notFound();
}

async function listEntities(entity: string, env: Env, request?: Request): Promise<Response> {
  const table = getTable(entity);
  const validColumns = ENTITY_VALID_COLUMNS[entity];

  let query = `SELECT * FROM ${table}`;
  const params: unknown[] = [];

  if (request) {
    const url = new URL(request.url);
    const filters: string[] = [];

    for (const [key, value] of url.searchParams.entries()) {
      if (validColumns && validColumns.includes(key)) {
        filters.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (filters.length > 0) {
      query += ` WHERE ${filters.join(" AND ")}`;
    }
  }

  query += " ORDER BY created_at DESC";

  const rows = await env.DB.prepare(query).bind(...params).all();
  return json(rows.results);
}

async function getEntity(entity: string, id: string, env: Env): Promise<Response> {
  const table = getTable(entity);
  const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
  if (!row) return notFound(`${entity} not found`);
  return json(row);
}

async function createEntity(entity: string, request: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown> = {};

  const contentType = request.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    body = await request.json();
  } else if (contentType?.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    formData.forEach((value, key) => {
      body[key] = value;
    });
  } else {
    return error("Unsupported content type", 415);
  }

  const id = uuid();
  const table = getTable(entity);
  const validColumns = ENTITY_VALID_COLUMNS[entity] || [];

  const filteredColumns = Object.keys(body).filter((col) => validColumns.includes(col));
  if (filteredColumns.length === 0) {
    return error("No valid columns provided", 400);
  }

  const placeholders = filteredColumns.map(() => "?").join(", ");
  const insertSql = `INSERT INTO ${table} (id, ${filteredColumns.join(", ")}) VALUES (?, ${placeholders})`;
  const values = [id, ...filteredColumns.map((col) => body[col])];

  await env.DB.prepare(insertSql).bind(...values).run();
  const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
  return json(row, 201);
}

async function updateEntity(entity: string, id: string, request: Request, env: Env): Promise<Response> {
  const body = await request.json<Record<string, unknown>>();
  const table = getTable(entity);
  const validColumns = ENTITY_VALID_COLUMNS[entity] || [];

  const filteredColumns = Object.keys(body).filter((col) => validColumns.includes(col));
  if (filteredColumns.length === 0) {
    return error("No valid columns provided", 400);
  }

  const updateSql = `UPDATE ${table} SET ${filteredColumns.map((col) => `${col} = ?`).join(", ")} WHERE id = ?`;
  const values = [...filteredColumns.map((col) => body[col]), id];

  const existing = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
  if (!existing) return notFound(`${entity} not found`);

  await env.DB.prepare(updateSql).bind(...values).run();
  const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
  return json(row);
}

async function deleteEntity(entity: string, id: string, env: Env): Promise<Response> {
  const table = getTable(entity);
  const existing = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
  if (!existing) return notFound(`${entity} not found`);

  await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  return json({ deleted: true });
}

async function listPropertyContacts(id: string, env: Env): Promise<Response> {
  const rows = await env.DB.prepare(
    "SELECT c.*, pc.role FROM property_contacts pc JOIN contacts c ON c.id = pc.contact_id WHERE pc.property_id = ?",
  ).bind(id).all();
  return json(rows.results);
}

async function addPropertyContact(id: string, request: Request, env: Env): Promise<Response> {
  const body = await request.json<{ contact_id: string; role: string }>();
  if (!body.contact_id || !body.role) return error("contact_id and role are required");

  await env.DB.prepare(
    "INSERT INTO property_contacts (property_id, contact_id, role) VALUES (?, ?, ?)",
  ).bind(id, body.contact_id, body.role).run();

  return json({ created: true }, 201);
}

async function listPropertyFiles(id: string, env: Env): Promise<Response> {
  const rows = await env.DB.prepare(
    "SELECT * FROM property_files WHERE property_id = ? ORDER BY created_at DESC",
  ).bind(id).all();
  return json(rows.results);
}

async function uploadPropertyFile(id: string, request: Request, env: Env): Promise<Response> {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return error("file is required");

  const key = `${id}/${uuid()}-${file.name}`;
  await env.FILES.put(key, file, {
    httpMetadata: { contentType: file.type },
  });

  const fileId = uuid();
  await env.DB.prepare(
    "INSERT INTO property_files (id, property_id, r2_key, filename, content_type, size_bytes) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(fileId, id, key, file.name, file.type || null, file.size).run();

  return json({ id: fileId, r2_key: key, filename: file.name }, 201);
}

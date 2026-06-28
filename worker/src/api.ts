import { json, error, uuid, notFound, parsePagination } from "./utils";
import { verifyJWT, type User } from "./auth";
import type { Env } from "./index";

export async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, "") || "/";
  const method = request.method;
  const start = Date.now();

  try {
    // Verify JWT token
    const auth = request.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return error("Missing authorization", 401);
    }

    const token = auth.slice(7);
    const secret = env.JWT_SECRET || "dev-secret";
    let user: User;
    try {
      user = await verifyJWT(token, secret);
    } catch (e) {
      return error("Invalid token", 401);
    }

    if (path === "/health" && method === "GET") {
      return json({ status: "ok", environment: env.ENVIRONMENT });
    }

    const response = await routeEntities(path, method, request, env, user);
    console.log(`[${method}] ${path} ${response.status} ${Date.now() - start}ms (user: ${user.id})`);
    return response;
  } catch (e) {
    console.error(`[${method}] ${path} ERROR ${Date.now() - start}ms`, e);
    return error(e instanceof Error ? e.message : "Internal error", 500);
  }
}

const SAFE_TABLES: Record<string, string> = {
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

const ENTITY_SCHEMAS: Record<string, Record<string, { required?: boolean; type: string; max?: number }>> = {
  properties: {
    name: { required: true, type: "string", max: 255 },
    address: { type: "string", max: 500 },
    type: { type: "string" },
    status: { type: "string" },
  },
  suppliers: {
    name: { required: true, type: "string", max: 255 },
    email: { type: "string", max: 255 },
    phone: { type: "string", max: 50 },
    company: { type: "string", max: 255 },
  },
  contacts: {
    name: { required: true, type: "string", max: 255 },
    email: { type: "string", max: 255 },
    phone: { type: "string", max: 50 },
    role: { type: "string", max: 100 },
    company: { type: "string", max: 255 },
  },
  invoices: {
    property_id: { required: true, type: "string" },
    amount: { required: true, type: "number" },
    supplier_id: { type: "string" },
    status: { type: "string" },
    due_date: { type: "string" },
    description: { type: "string", max: 1000 },
  },
  tasks: {
    title: { required: true, type: "string", max: 255 },
    description: { type: "string", max: 2000 },
    priority: { type: "string" },
    status: { type: "string" },
    due_date: { type: "string" },
    assigned_to: { type: "string" },
  },
};

function getTable(entity: string): string {
  const table = SAFE_TABLES[entity];
  if (!table) throw new Error(`Invalid entity: ${entity}`);
  return table;
}

function validateColumns(entity: string, body: Record<string, unknown>): Record<string, unknown> {
  const allowed = ENTITY_VALID_COLUMNS[entity] || [];
  const schema = ENTITY_SCHEMAS[entity] || {};
  const filtered: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (!allowed.includes(key)) continue;
    const rule = schema[key];
    if (!rule) {
      filtered[key] = value;
      continue;
    }

    if (rule.type === "number") {
      const num = Number(value);
      if (isNaN(num)) continue;
      filtered[key] = num;
    } else if (rule.type === "string" && typeof value === "string") {
      filtered[key] = rule.max ? value.slice(0, rule.max) : value;
    } else {
      filtered[key] = value;
    }
  }

  for (const [key, rule] of Object.entries(schema)) {
    if (rule.required && !(key in filtered)) {
      throw new Error(`${key} is required`);
    }
  }

  return filtered;
}

function now(): string {
  return new Date().toISOString();
}

async function routeEntities(path: string, method: string, request: Request, env: Env, user: User): Promise<Response> {
  const match = path.match(
    /^\/(properties|suppliers|contacts|invoices|maintenance|documents|data-sources|pl|pl-monthly|pl-entries|petty-cash-expenses|petty-cash-income|tasks)(?:\/([^/]+))?(?:\/([^/]+))?$/,
  );

  if (!match) return notFound(`Unknown route: ${path}`);

  const entity = match[1];
  const id = match[2];
  const sub = match[3];

  if (!id) {
    if (method === "GET") return listEntities(entity, env, request);
    if (method === "POST") return createEntity(entity, request, env, user);
    return error("Method not allowed", 405);
  }

  if (!sub) {
    if (method === "GET") return getEntity(entity, id, env);
    if (method === "PATCH" || method === "PUT") return updateEntity(entity, id, request, env, user);
    if (method === "DELETE") return deleteEntity(entity, id, env, user);
    return error("Method not allowed", 405);
  }

  if (entity === "properties") {
    if (sub === "contacts") {
      if (method === "GET") return listPropertyContacts(id, env);
      if (method === "POST") return addPropertyContact(id, request, env, user);
      return error("Method not allowed", 405);
    }
    if (sub === "files") {
      if (method === "GET") return listPropertyFiles(id, env);
      if (method === "POST") return uploadPropertyFile(id, request, env, user);
      return error("Method not allowed", 405);
    }
  }

  return notFound();
}

async function listEntities(entity: string, env: Env, request?: Request): Promise<Response> {
  const table = getTable(entity);
  const validColumns = ENTITY_VALID_COLUMNS[entity];
  const url = request ? new URL(request.url) : null;
  const { limit, offset, page } = url ? parsePagination(url) : { limit: 20, offset: 0, page: 1 };

  let query = `SELECT * FROM ${table} WHERE deleted_at IS NULL`;
  const params: unknown[] = [];

  if (url) {
    const filters: string[] = [];
    for (const [key, value] of url.searchParams.entries()) {
      if (validColumns && validColumns.includes(key)) {
        filters.push(`${key} = ?`);
        params.push(value);
      }
    }
    if (filters.length > 0) {
      query += ` AND ${filters.join(" AND ")}`;
    }
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const rows = await env.DB.prepare(query).bind(...params).all();

  // Get total count for pagination
  let countQuery = `SELECT COUNT(*) as count FROM ${table} WHERE deleted_at IS NULL`;
  const filterParams: unknown[] = [];
  if (url) {
    const filters: string[] = [];
    for (const [key, value] of url.searchParams.entries()) {
      if (validColumns && validColumns.includes(key)) {
        filters.push(`${key} = ?`);
        filterParams.push(value);
      }
    }
    if (filters.length > 0) {
      countQuery += ` AND ${filters.join(" AND ")}`;
    }
  }

  const countResult = (await env.DB.prepare(countQuery).bind(...filterParams).first()) as { count: number };
  return json({
    data: rows.results,
    pagination: { page, limit, total: countResult.count, pages: Math.ceil(countResult.count / limit) },
  });
}

async function getEntity(entity: string, id: string, env: Env): Promise<Response> {
  const table = getTable(entity);
  const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ? AND deleted_at IS NULL`).bind(id).first();
  if (!row) return notFound(`${entity} not found`);
  return json(row);
}

async function createEntity(entity: string, request: Request, env: Env, user: User): Promise<Response> {
  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 1024 * 1024) {
      return error("Payload too large", 413);
    }

    const body = await request.json();
    const validated = validateColumns(entity, body);

    const id = uuid();
    const table = getTable(entity);
    const validColumns = ENTITY_VALID_COLUMNS[entity] || [];
    const filteredColumns = Object.keys(validated).filter((col) => validColumns.includes(col));

    if (filteredColumns.length === 0) {
      return error("No valid columns provided", 400);
    }

    const placeholders = filteredColumns.map(() => "?").join(", ");
    const insertSql = `INSERT INTO ${table} (id, ${filteredColumns.join(", ")}, created_at, updated_at, created_by) VALUES (?, ${placeholders}, ?, ?, ?)`;
    const values = [id, ...filteredColumns.map((col) => validated[col]), now(), now(), user.id];

    await env.DB.prepare(insertSql).bind(...values).run();

    // Log to audit trail
    await env.DB.prepare(
      `INSERT INTO audit_log (id, entity_type, entity_id, action, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(uuid(), entity, id, "CREATE", user.id, now())
      .run();

    const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
    return json(row, 201);
  } catch (e) {
    if (e instanceof SyntaxError) return error("Invalid JSON", 400);
    return error(e instanceof Error ? e.message : "Creation failed", 400);
  }
}

async function updateEntity(entity: string, id: string, request: Request, env: Env, user: User): Promise<Response> {
  try {
    const body = await request.json();
    const validated = validateColumns(entity, body);
    const table = getTable(entity);
    const validColumns = ENTITY_VALID_COLUMNS[entity] || [];
    const filteredColumns = Object.keys(validated).filter((col) => validColumns.includes(col));

    if (filteredColumns.length === 0) {
      return error("No valid columns provided", 400);
    }

    const existing = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ? AND deleted_at IS NULL`).bind(id).first();
    if (!existing) return notFound(`${entity} not found`);

    const updateSql = `UPDATE ${table} SET ${filteredColumns.map((col) => `${col} = ?`).join(", ")}, updated_at = ?, updated_by = ? WHERE id = ?`;
    const values = [...filteredColumns.map((col) => validated[col]), now(), user.id, id];

    await env.DB.prepare(updateSql).bind(...values).run();

    // Log to audit trail
    await env.DB.prepare(
      `INSERT INTO audit_log (id, entity_type, entity_id, action, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(uuid(), entity, id, "UPDATE", user.id, now())
      .run();

    const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
    return json(row);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Update failed", 400);
  }
}

async function deleteEntity(entity: string, id: string, env: Env, user: User): Promise<Response> {
  const table = getTable(entity);
  const existing = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ? AND deleted_at IS NULL`).bind(id).first();
  if (!existing) return notFound(`${entity} not found`);

  await env.DB.prepare(`UPDATE ${table} SET deleted_at = ?, updated_at = ?, updated_by = ? WHERE id = ?`)
    .bind(now(), now(), user.id, id)
    .run();

  // Log to audit trail
  await env.DB.prepare(
    `INSERT INTO audit_log (id, entity_type, entity_id, action, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(uuid(), entity, id, "DELETE", user.id, now())
    .run();

  return json({ deleted: true });
}

async function listPropertyContacts(id: string, env: Env): Promise<Response> {
  const rows = await env.DB.prepare(
    "SELECT c.*, pc.role FROM property_contacts pc JOIN contacts c ON c.id = pc.contact_id WHERE pc.property_id = ? AND c.deleted_at IS NULL",
  )
    .bind(id)
    .all();
  return json(rows.results);
}

async function addPropertyContact(id: string, request: Request, env: Env, user: User): Promise<Response> {
  const body = (await request.json()) as { contact_id: string; role: string };
  if (!body.contact_id || !body.role) return error("contact_id and role are required");

  await env.DB.prepare("INSERT INTO property_contacts (property_id, contact_id, role) VALUES (?, ?, ?)")
    .bind(id, body.contact_id, body.role)
    .run();

  await env.DB.prepare(
    `INSERT INTO audit_log (id, entity_type, entity_id, action, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(uuid(), "property_contacts", `${id}:${body.contact_id}`, "CREATE", user.id, now())
    .run();

  return json({ created: true }, 201);
}

async function listPropertyFiles(id: string, env: Env): Promise<Response> {
  const rows = await env.DB.prepare("SELECT * FROM property_files WHERE property_id = ? ORDER BY created_at DESC")
    .bind(id)
    .all();
  return json(rows.results);
}

async function uploadPropertyFile(id: string, request: Request, env: Env, user: User): Promise<Response> {
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
  )
    .bind(fileId, id, key, file.name, file.type || null, file.size)
    .run();

  await env.DB.prepare(
    `INSERT INTO audit_log (id, entity_type, entity_id, action, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(uuid(), "property_files", fileId, "CREATE", user.id, now())
    .run();

  return json({ id: fileId, r2_key: key, filename: file.name }, 201);
}

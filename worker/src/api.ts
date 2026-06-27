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

async function routeEntities(
  path: string,
  method: string,
  request: Request,
  env: Env,
): Promise<Response> {
  const match = path.match(/^\/(properties|suppliers|contacts|invoices|maintenance|documents|data-sources)(?:\/([^/]+))?(?:\/([^/]+))?$/);

  if (!match) {
    return notFound(`Unknown route: ${path}`);
  }

  const entity = match[1];
  const id = match[2];
  const sub = match[3];

  if (!id) {
    if (method === "GET") return listEntities(entity, env);
    if (method === "POST") return createEntity(entity, request, env);
    return error("Method not allowed", 405);
  }

  if (!sub) {
    if (method === "GET") return getEntity(entity, id, env);
    if (method === "PATCH") return updateEntity(entity, id, request, env);
    if (method === "DELETE") return deleteEntity(entity, id, env);
    return error("Method not allowed", 405);
  }

  // Handle sub-entities for properties
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

async function listProperties(env: Env): Promise<Response> {
  const rows = await env.DB.prepare(
    "SELECT * FROM properties ORDER BY created_at DESC",
  ).all();
  return json(rows.results);
}

async function createProperty(request: Request, env: Env): Promise<Response> {
  const body = await request.json<{
    name?: string;
    address?: string;
    type?: string;
    status?: string;
  }>();
  if (!body.name) return error("name is required");

  const id = uuid();
  await env.DB.prepare(
    "INSERT INTO properties (id, name, address, type, status) VALUES (?, ?, ?, ?, ?)",
  ).bind(id, body.name, body.address || null, body.type || null, body.status || "active").run();

  const row = await env.DB.prepare("SELECT * FROM properties WHERE id = ?").bind(id).first();
  return json(row, 201);
}

  async function getEntity(entity: string, id: string, env: Env): Promise<Response> {
    const table = entity === "properties" ? "properties" :
                  entity === "suppliers" ? "suppliers" :
                  entity === "contacts" ? "contacts" :
                  entity === "invoices" ? "invoices" :
                  entity === "maintenance" ? "maintenance" :
                  entity === "documents" ? "documents" : "data_sources";
    const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
    if (!row) return notFound(`${entity} not found`);
    return json(row);
  }

  async function updateEntity(entity: string, id: string, request: Request, env: Env): Promise<Response> {
    const body = await request.json<Record<string, unknown>>();
    const table = entity === "properties" ? "properties" :
                  entity === "suppliers" ? "suppliers" :
                  entity === "contacts" ? "contacts" :
                  entity === "invoices" ? "invoices" :
                  entity === "maintenance" ? "maintenance" :
                  entity === "documents" ? "documents" : "data_sources";
    const columns = Object.keys(body);
    const placeholders = columns.map(() => "?").join(", ");
    const updateSql = `UPDATE ${table} SET ${columns.map(col => `${col} = ?`).join(", ")} WHERE id = ?`;
    const values = [...Object.values(body), id];

    const existing = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
    if (!existing) return notFound(`${entity} not found`);

    await env.DB.prepare(updateSql).bind(...values).run();
    const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
    return json(row);
  }

  async function deleteEntity(entity: string, id: string, env: Env): Promise<Response> {
    const table = entity === "properties" ? "properties" :
                  entity === "suppliers" ? "suppliers" :
                  entity === "contacts" ? "contacts" :
                  entity === "invoices" ? "invoices" :
                  entity === "maintenance" ? "maintenance" :
                  entity === "documents" ? "documents" : "data_sources";
    const existing = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
    if (!existing) return notFound(`${entity} not found`);

    await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
    return json({ deleted: true });
  }

  async function listEntities(entity: string, env: Env): Promise<Response> {
    const table = entity === "properties" ? "properties" :
                  entity === "suppliers" ? "suppliers" :
                  entity === "contacts" ? "contacts" :
                  entity === "invoices" ? "invoices" :
                  entity === "maintenance" ? "maintenance" :
                  entity === "documents" ? "documents" : "data_sources";
    const rows = await env.DB.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC`).all();
    return json(rows.results);
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
    const table = entity === "properties" ? "properties" :
                  entity === "suppliers" ? "suppliers" :
                  entity === "contacts" ? "contacts" :
                  entity === "invoices" ? "invoices" :
                  entity === "maintenance" ? "maintenance" :
                  entity === "documents" ? "documents" : "data_sources";

    const columns = Object.keys(body);
    const placeholders = columns.map(() => "?").join(", ");
    const insertSql = `INSERT INTO ${table} (id, ${columns.join(", ")}) VALUES (?, ${placeholders})`;
    const values = [id, ...Object.values(body)];

    await env.DB.prepare(insertSql).bind(...values).run();
    const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
    return json(row, 201);
  }

  async function getProperty(id: string, env: Env): Promise<Response> {
  const body = await request.json<{
    name?: string;
    address?: string;
    type?: string;
    status?: string;
  }>();

  const existing = await env.DB.prepare("SELECT * FROM properties WHERE id = ?").bind(id).first();
  if (!existing) return notFound("Property not found");

  await env.DB.prepare(
    "UPDATE properties SET name = ?, address = ?, type = ?, status = ? WHERE id = ?",
  ).bind(
    body.name ?? (existing as Record<string, unknown>).name,
    body.address ?? (existing as Record<string, unknown>).address,
    body.type ?? (existing as Record<string, unknown>).type,
    body.status ?? (existing as Record<string, unknown>).status,
    id,
  ).run();

  const row = await env.DB.prepare("SELECT * FROM properties WHERE id = ?").bind(id).first();
  return json(row);
}

async function deleteProperty(id: string, env: Env): Promise<Response> {
  const existing = await env.DB.prepare("SELECT * FROM properties WHERE id = ?").bind(id).first();
  if (!existing) return notFound("Property not found");

  await env.DB.prepare("DELETE FROM properties WHERE id = ?").bind(id).run();
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

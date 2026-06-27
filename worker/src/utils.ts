export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function error(msg: string, status = 400): Response {
  return json({ error: msg }, status);
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function notFound(msg = "Not found"): Response {
  return error(msg, 404);
}

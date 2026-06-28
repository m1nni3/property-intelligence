export function json(data: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export function error(msg: string, status = 400, headers?: Record<string, string>): Response {
  return json({ error: msg }, status, headers);
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function notFound(msg = "Not found"): Response {
  return error(msg, 404);
}

export function addCorsHeaders(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(response.body, { status: response.status, headers });
}

export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return new Response(response.body, { status: response.status, headers });
}

export function logRequest(method: string, path: string, status: number, duration: number): void {
  const level = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO";
  console.log(`[${level}] ${method} ${path} ${status} ${duration}ms`);
}

export function parsePagination(url: URL): { limit: number; offset: number; page: number } {
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;
  return { limit, offset, page };
}

export async function rateLimit(request: Request, env: { RATE_LIMIT_KV?: KVNamespace }): Promise<Response | null> {
  const clientId = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
  const key = `ratelimit:${clientId}`;
  const windowMs = 60 * 60 * 1000;
  const maxRequests = 100;

  if (!env.RATE_LIMIT_KV) return null;

  const cached = await env.RATE_LIMIT_KV.get(key);
  const count = cached ? parseInt(cached) : 0;

  if (count >= maxRequests) {
    return error(`Rate limit exceeded. Try again later.`, 429, {
      "Retry-After": "3600",
      "X-RateLimit-Limit": String(maxRequests),
      "X-RateLimit-Remaining": "0",
    });
  }

  const newCount = count + 1;
  await env.RATE_LIMIT_KV.put(key, String(newCount), { expirationTtl: 3600 });

  return null;
}
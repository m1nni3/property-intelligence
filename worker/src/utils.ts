export interface Env {
  RATE_LIMIT_KV?: KVNamespace;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const RATE_LIMIT_WINDOW = 60 * 60; // seconds
const RATE_LIMIT_MAX_REQUESTS = 100;

export function json(
  data: unknown,
  status = 200,
  headers: HeadersInit = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

export function error(
  message: string,
  status = 400,
  headers: HeadersInit = {}
): Response {
  return json({ error: message }, status, headers);
}

export function notFound(message = "Not found"): Response {
  return error(message, 404);
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function options(): Response {
  return withStandardHeaders(new Response(null, { status: 204 }));
}

export function addCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  headers.set("Access-Control-Allow-Origin", "*");
  headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  headers.set("Access-Control-Max-Age", "86400");

  return cloneResponse(response, headers);
}

export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("Permissions-Policy", "geolocation=(), microphone=()");
  headers.set("X-XSS-Protection", "0");

  return cloneResponse(response, headers);
}

export function withStandardHeaders(response: Response): Response {
  return addSecurityHeaders(addCorsHeaders(response));
}

function cloneResponse(response: Response, headers: Headers): Response {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function logRequest(
  method: string,
  path: string,
  status: number,
  durationMs: number
): void {
  const message = `${method} ${path} ${status} ${durationMs}ms`;

  if (status >= 500) {
    console.error(message);
  } else if (status >= 400) {
    console.warn(message);
  } else {
    console.info(message);
  }
}

export interface Pagination {
  page: number;
  limit: number;
  offset: number;
}

export function parsePagination(url: URL): Pagination {
  const page = clampInteger(
    url.searchParams.get("page"),
    DEFAULT_PAGE,
    DEFAULT_PAGE,
    Number.MAX_SAFE_INTEGER
  );

  const limit = clampInteger(
    url.searchParams.get("limit"),
    DEFAULT_LIMIT,
    1,
    MAX_LIMIT
  );

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

function clampInteger(
  value: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(number)));
}

export async function rateLimit(
  request: Request,
  env: Env
): Promise<Response | null> {
  const kv = env.RATE_LIMIT_KV;

  if (!kv) {
    return null;
  }

  const clientId =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "unknown";

  const key = `ratelimit:${clientId}`;

  const current =
    Number(await kv.get(key)) || 0;

  if (current >= RATE_LIMIT_MAX_REQUESTS) {
    return withStandardHeaders(
      error("Rate limit exceeded. Try again later.", 429, {
        "Retry-After": String(RATE_LIMIT_WINDOW),
        "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
        "X-RateLimit-Remaining": "0",
      })
    );
  }

  const next = current + 1;

  await kv.put(key, String(next), {
    expirationTtl: RATE_LIMIT_WINDOW,
  });

  return null;
}

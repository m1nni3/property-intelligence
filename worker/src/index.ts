import { handleApiRequest } from "./api";
import { handleAuthRequest } from "./auth";
import { addCorsHeaders, addSecurityHeaders, logRequest, rateLimit } from "./utils";

export interface Env {
  DB: D1Database;
  FINANCE_DB: D1Database;
  FILES: R2Bucket;
  PROPERTY_KV: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;
  ASSETS: Fetcher;
  ENVIRONMENT: string;
  JWT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const start = Date.now();

    if (request.method === "OPTIONS") {
      return addCorsHeaders(new Response(null, { status: 204 }), request);
    }

    const limited = await rateLimit(request, env);
    if (limited) {
      const duration = Date.now() - start;
      logRequest(request.method, url.pathname, limited.status, duration);
      return limited;
    }

    let response: Response;

    if (url.pathname.startsWith("/auth/")) {
      response = await handleAuthRequest(request, env);
    } else if (url.pathname.startsWith("/api/")) {
      response = await handleApiRequest(request, env);
    } else {
      response = await env.ASSETS.fetch(request);
    }

    response = addSecurityHeaders(response);
    response = addCorsHeaders(response, request);

    const duration = Date.now() - start;
    logRequest(request.method, url.pathname, response.status, duration);

    return response;
  },
};

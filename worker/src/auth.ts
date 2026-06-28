import { json, error } from "./utils";
import type { Env } from "./index";

export interface User {
  id: string;
  email: string;
  role: "admin" | "user" | "viewer";
  iat: number;
  exp: number;
}

const ALGORITHM = "HS256";

async function signJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

  const headerObj = { alg: ALGORITHM, typ: "JWT" };
  const header = btoa(JSON.stringify(headerObj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const body = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  const message = `${header}.${body}`;
  const signature = await crypto.subtle.sign("HMAC", secretKey, encoder.encode(message));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  return `${message}.${sig}`;
}

export async function verifyJWT(token: string, secret: string): Promise<User> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");

  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);

  const [header, body, sig] = parts;
  const message = `${header}.${body}`;
  const signatureBuf = Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

  const valid = await crypto.subtle.verify("HMAC", secretKey, signatureBuf, encoder.encode(message));
  if (!valid) throw new Error("Invalid signature");

  const payloadStr = atob(body.replace(/-/g, "+").replace(/_/g, "/"));
  const payload = JSON.parse(payloadStr) as User;

  if (payload.exp && payload.exp < Date.now() / 1000) throw new Error("Token expired");

  return payload;
}

export async function handleAuthRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/auth/, "");
  const method = request.method;

  if (path === "/login" && method === "POST") {
    return handleLogin(request, env);
  }

  if (path === "/verify" && method === "POST") {
    return handleVerify(request, env);
  }

  if (path === "/refresh" && method === "POST") {
    return handleRefresh(request, env);
  }

  return error("Not found", 404);
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as { email: string; password: string };
    if (!body.email || !body.password) {
      return error("email and password required", 400);
    }

    if (body.email !== "test@example.com" || body.password !== "password123") {
      return error("Invalid credentials", 401);
    }

    const secret = env.JWT_SECRET || "dev-secret";
    const now = Math.floor(Date.now() / 1000);
    const userPayload: Record<string, unknown> = {
      id: "user-123",
      email: body.email,
      role: "admin",
      iat: now,
      exp: now + 3600,
    };

    const token = await signJWT(userPayload, secret);
    const refreshPayload: Record<string, unknown> = { ...userPayload, exp: now + 86400 * 7 };
    const refreshToken = await signJWT(refreshPayload, secret);

    return json({ token, refreshToken, user: { id: userPayload.id, email: userPayload.email, role: userPayload.role } }, 200);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Login failed", 500);
  }
}

async function handleVerify(request: Request, env: Env): Promise<Response> {
  try {
    const auth = request.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return error("Missing authorization header", 401);
    }

    const token = auth.slice(7);
    const secret = env.JWT_SECRET || "dev-secret";
    const user = await verifyJWT(token, secret);

    return json({ valid: true, user: { id: user.id, email: user.email, role: user.role } }, 200);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Token verification failed", 401);
  }
}

async function handleRefresh(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as { refreshToken: string };
    if (!body.refreshToken) {
      return error("refreshToken required", 400);
    }

    const secret = env.JWT_SECRET || "dev-secret";
    const user = await verifyJWT(body.refreshToken, secret);

    const now = Math.floor(Date.now() / 1000);
    const newPayload: Record<string, unknown> = {
      id: user.id,
      email: user.email,
      role: user.role,
      iat: now,
      exp: now + 3600,
    };
    const newToken = await signJWT(newPayload, secret);

    return json({ token: newToken }, 200);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Token refresh failed", 401);
  }
}

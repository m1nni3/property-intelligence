const BASE = "/api";

const cache = new Map();
const inflight = new Map();
const CACHE_TTL = 60000;

async function performRequest(path, options = {}) {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
      });

      if (res.status >= 400 && res.status < 500) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
      return data;
    } catch (e) {
      const isLastAttempt = attempt === maxRetries;
      const isNetworkError = e instanceof TypeError;
      if (isNetworkError && !isLastAttempt) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw e;
      }
    }
  }
}

export async function api(path, options = {}) {
  const method = options.method || "GET";
  const key = `${method}:${path}`;

  if (method === "GET" && cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (Date.now() - timestamp < CACHE_TTL) return data;
  }

  if (inflight.has(key)) return inflight.get(key);

  const promise = performRequest(path, options);
  inflight.set(key, promise);

  try {
    const data = await promise;
    if (method === "GET") cache.set(key, { data, timestamp: Date.now() });
    return data;
  } finally {
    inflight.delete(key);
  }
}

function invalidateCache(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

export async function get(path) {
  return api(path);
}

export async function post(path, body) {
  const result = await api(path, { method: "POST", body: JSON.stringify(body) });
  invalidateCache(path.split("/")[1]);
  return result;
}

export async function patch(path, body) {
  const result = await api(path, { method: "PATCH", body: JSON.stringify(body) });
  invalidateCache(path.split("/")[1]);
  return result;
}

export async function del(path) {
  const result = await api(path, { method: "DELETE" });
  invalidateCache(path.split("/")[1]);
  return result;
}

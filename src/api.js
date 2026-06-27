const BASE = "/api";

export async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export async function get(path) {
  return api(path);
}

export async function post(path, body) {
  return api(path, { method: "POST", body: JSON.stringify(body) });
}

export async function patch(path, body) {
  return api(path, { method: "PATCH", body: JSON.stringify(body) });
}

export async function del(path) {
  return api(path, { method: "DELETE" });
}

import { BaseConnector } from "./base-connector.js";

export class HttpConnector extends BaseConnector {
  async connect() {
    const { base_url, api_key } = this.config;
    const url = base_url || this.source.base_url;
    if (!url) throw new Error(`HTTP connector ${this.name}: base_url required`);
    this.baseUrl = url.replace(/\/$/, "");
    this.apiKey = api_key || null;
    return true;
  }

  async disconnect() {
    return true;
  }

  async fetch(cursor) {
    const url = cursor
      ? `${this.baseUrl}/data?cursor=${encodeURIComponent(cursor)}`
      : `${this.baseUrl}/data`;

    const headers = { "Content-Type": "application/json" };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${this.name}: ${await res.text()}`);
    }

    const body = await res.json();
    return {
      records: body.data || body.records || body.results || (Array.isArray(body) ? body : []),
      cursor: body.cursor || body.next_cursor || null,
    };
  }

  validateConfig() {
    const { base_url } = this.config;
    if (!base_url) return { valid: false, error: "base_url is required" };
    try {
      new URL(base_url);
    } catch {
      return { valid: false, error: "base_url must be a valid URL" };
    }
    return { valid: true };
  }
}

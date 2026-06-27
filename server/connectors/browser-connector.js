import { BaseConnector } from "./base-connector.js";

export class BrowserConnector extends BaseConnector {
  async connect() {
    const { portal_url, login_url, username, password } = this.config;
    if (!portal_url) throw new Error(`Browser connector ${this.name}: portal_url required`);
    this.portalUrl = portal_url.replace(/\/$/, "");
    this.loginUrl = login_url;
    this.credentials = { username, password };
    return true;
  }

  async disconnect() {
    return true;
  }

  async fetch(cursor) {
    const url = cursor
      ? `${this.portalUrl}/api/data?cursor=${encodeURIComponent(cursor)}`
      : `${this.portalUrl}/api/data`;

    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Portal ${res.status} from ${this.name}: ${await res.text()}`);
    }

    const body = await res.json();
    return {
      records: body.data || body.records || [],
      cursor: body.cursor || body.next_cursor || null,
    };
  }

  validateConfig() {
    const { portal_url } = this.config;
    if (!portal_url) return { valid: false, error: "portal_url is required" };
    try {
      new URL(portal_url);
    } catch {
      return { valid: false, error: "portal_url must be a valid URL" };
    }
    return { valid: true };
  }
}

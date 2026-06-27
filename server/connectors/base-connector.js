export class BaseConnector {
  constructor(source) {
    this.source = source;
    this.name = source.name;
    this.config = source.config
      ? (typeof source.config === "string" ? JSON.parse(source.config) : source.config)
      : {};
  }

  async connect() {
    throw new Error("connect() must be implemented by subclass");
  }

  async disconnect() {
    throw new Error("disconnect() must be implemented by subclass");
  }

  async fetch(cursor) {
    throw new Error("fetch() must be implemented by subclass");
  }

  normalize(record) {
    return record;
  }

  validateConfig() {
    return { valid: true };
  }
}

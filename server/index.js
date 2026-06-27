import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./lib/db.js";
import { runMigration, runSeed } from "./lib/migrate.js";
import { registerCoreRoutes } from "./routes/core.js";
import { registerFinanceRoutes } from "./routes/finance.js";
import { registerMaintenanceRoutes } from "./routes/maintenance.js";
import { registerDocumentRoutes } from "./routes/documents.js";
import { registerDataSourceRoutes } from "./routes/data-sources.js";
import { registerCrudTables } from "./routes/crud.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;

// Ensure upload directory exists
mkdirSync(join(__dirname, "..", "uploads"), { recursive: true });

// Run migrations
runMigration(db, join(__dirname, "..", "migrations", "0001_core_domain.sql"), "0001");
runMigration(db, join(__dirname, "..", "migrations", "0003_statement_processing.sql"), "0003");
runMigration(db, join(__dirname, "..", "migrations", "0004_data_acquisition.sql"), "0004");
runMigration(db, join(__dirname, "..", "migrations", "0005_full_reference_schema.sql"), "0005");
runSeed(db, join(__dirname, "..", "migrations", "0002_seed.sql"));

// Build router
const router = {};
registerCoreRoutes(router);
registerFinanceRoutes(router);
registerMaintenanceRoutes(router);
registerDocumentRoutes(router);
registerDataSourceRoutes(router);
registerCrudTables(router);

function matchRoute(method, pathname) {
  for (const [pattern, handler] of Object.entries(router)) {
    const [pMethod, pPath] = pattern.split(" ");
    if (method !== pMethod) continue;

    const paramNames = [];
    const regexStr = pPath.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return "([^/]+)";
    });
    const re = new RegExp(`^${regexStr}$`);
    const match = pathname.match(re);
    if (match) {
      const params = {};
      paramNames.forEach((name, i) => (params[name] = match[i + 1]));
      return { handler, params };
    }
  }
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const route = matchRoute(req.method, url.pathname);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!route) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  try {
    const result = await route.handler(req, ...Object.values(route.params));
    res.writeHead(result.status || 200, result.headers);
    res.end(result.body);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: msg }));
  }
});

const HOST = process.env.HOST || "0.0.0.0";
server.listen(PORT, HOST, () => {
  console.log(`API server running on http://${HOST}:${PORT}`);
});

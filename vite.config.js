import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: "production/index.html",
        properties: "production/properties.html",
        contacts: "production/contacts.html",
        invoices: "production/invoices.html",
        maintenance: "production/maintenance.html",
        suppliers: "production/suppliers.html",
        documents: "production/documents.html",
        "data-sources": "production/data-sources.html",
        finances: "production/finances.html",
        debrief: "production/debrief.html",
        governance: "production/governance.html",
        "petty-cash": "production/petty-cash.html",
        portals: "production/portals.html",
        tasks: "production/tasks.html",
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 9173,
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
});

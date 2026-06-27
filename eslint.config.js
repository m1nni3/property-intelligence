import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: ["dist/", "node_modules/", ".wrangler/", "worker-configuration.d.ts"],
  },
  {
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },
];

import { defineConfig, globalIgnores } from "eslint/config";
import jest from "eslint-plugin-jest";
import js from "@eslint/js";
import ts from "typescript-eslint";

export default defineConfig([
  js.configs.recommended,
  ts.configs.recommended,
  globalIgnores(["dist", "node_modules"]),
  {
    files: ["**/__tests__/**"],
    plugins: { jest },
    languageOptions: {
      globals: jest.environments.globals.globals,
    },
  },
]);

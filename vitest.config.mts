import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      src: path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    globals: true,
    // Node by default: the game engine is pure, so most tests need no DOM.
    // Component tests opt in per file with `// @vitest-environment jsdom`.
    environment: "node",
    setupFiles: ["./src/tests/setup.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});

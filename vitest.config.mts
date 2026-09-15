import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const nodeMajorVersion = Number(process.versions.node.split(".")[0]);

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
    // Node 25+ ships its own `localStorage` global, which hides jsdom's and is undefined
    // without a backing file — every storage test would fail before it asserts anything.
    execArgv: nodeMajorVersion >= 25 ? ["--no-experimental-webstorage"] : [],
    exclude: ["node_modules/**", ".next/**"],
  },
});

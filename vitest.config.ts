import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Map the "@/..." path alias (from tsconfig) so unit tests can import app modules.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});

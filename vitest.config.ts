import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["utils/**/*.ts"],
      exclude: ["utils/apiClient.ts", "utils/apiTypes.ts", "utils/i18n.ts"],
    },
    include: ["__tests__/**/*.test.ts"],
  },
});

import { resolve } from "path";
import { defineConfig } from "vitest/config";
import type { CoverageOptions } from "vitest/node";

const coverageConfig: CoverageOptions<"v8"> = {
  provider: "v8",
  reporter: ["text", "json", "html"],
  include: ["src/modules/**"],
  exclude: [
    "node_modules/",
    "dist/",
    "src/test/",
    "**/*.d.ts",
    "**/*.config.*",
    "**/__tests__/**",
  ],
  thresholds: {
    lines: 80,
    functions: 80,
    statements: 80,
    branches: 70,
  },
};

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    env: {
      NODE_ENV: "test",
    },
    coverage: coverageConfig,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: [
            "src/__tests__/**/*.test.ts",
            "src/config/__tests__/**/*.test.ts",
          ],
          setupFiles: ["./src/test/setup-env.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
          exclude: [
            "node_modules",
            "dist",
            ".idea",
            ".git",
            ".cache",
            "src/__tests__/**",
            "src/config/__tests__/**",
          ],
          setupFiles: ["./src/test/setup.ts"],
          pool: "forks",
          poolOptions: {
            forks: {
              singleFork: true,
            },
          },
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import playwright from "eslint-plugin-playwright";
import eslintConfigPrettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  // 1. Global Ignores (Merged Legacy and Newly Requested Ignores)
  {
    ignores: [
      // Folders
      ".next/**",
      "node_modules/**",
      "dist/**",
      "esm/**",
      "public/**",
      "tests/**",
      "scripts/**",
      "coverage/**",
      "build/**",
      "out/**",
      "playwright-report/**",
      "test-results/**",

      // Individual Files
      "*.config.js",
      "**/*.css",
      "next-env.d.ts"
    ],
  },

  // 2. Base Next.js & TypeScript configurations via FlatCompat
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // 3. Custom global rules
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/triple-slash-reference": "warn",
    },
  },

  // 4. Playwright override config block
  {
    files: ["__tests__/playwright/**"],
    ...playwright.configs["flat/recommended"],
    rules: {
      "playwright/no-nested-step": "off",
    },
  },

  // 5. Prettier config to turn off conflicting rules (Must always be last)
  eslintConfigPrettier,
];

import tseslint from "@typescript-eslint/eslint-plugin";
import nextConfig from "eslint-config-next";
import eslintConfigPrettier from "eslint-config-prettier";
import playwright from "eslint-plugin-playwright";

const playwrightRecommended = playwright.configs["flat/recommended"] ?? {};

export default [
  {
    ignores: [
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
      "*.config.js",
      "**/*.css",
      "next-env.d.ts",
    ],
  },
  ...nextConfig,
  {
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/triple-slash-reference": "warn",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
  {
    files: ["__tests__/playwright/**"],
    plugins: { playwright },
    languageOptions: playwrightRecommended.languageOptions ?? {},
    rules: {
      ...(playwrightRecommended.rules ?? {}),
      "playwright/no-nested-step": "off",
    },
  },
  eslintConfigPrettier,
];

import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import react from "eslint-plugin-react";
import tsParser from "@typescript-eslint/parser";
import hooksPlugin from 'eslint-plugin-react-hooks';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    ignores: ["**/public/**/*", ".local/**/*", "node_modules/**/*", "src/coverage/**/*"],
  },
  {
    plugins: {
      react,
      "@typescript-eslint": typescriptEslint,
      'react-hooks': hooksPlugin,
      "react-refresh": reactRefresh,
      eslintPluginPrettierRecommended,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
      },

      parser: tsParser,
      ecmaVersion: 12,
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],

      "no-import-assign": "error",
      "no-unreachable": "error",
    },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
  },
];
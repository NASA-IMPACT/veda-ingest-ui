import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import playwrightPlugin from 'eslint-plugin-playwright';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: prettier.rules,
  },
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'playwright-report/**',
      'test-results/**',
      'node_modules/**',
    ],
  },
  {
    files: ['__tests__/playwright/**'],
    plugins: {
      playwright: playwrightPlugin,
    },
    rules: playwrightPlugin.configs['recommended'].rules,
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '**/playwright-report/**',
    '**/test-results/**',
    '**/node_modules/**',
  ]),
]);

export default eslintConfig;


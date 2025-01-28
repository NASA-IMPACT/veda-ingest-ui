import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/playwright',
  webServer: {
    command: 'NEXT_PUBLIC_DISABLE_AUTH=true yarn dev',
    port: 3000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  testMatch: ['**/__tests__/playwright/**/*.test.tsx'],
  timeout: 30000,
});

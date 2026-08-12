import { defineConfig } from '@playwright/test';

import dotenv from 'dotenv';
dotenv.config();

const webServerCommand = process.env.CI
  ? 'NEXT_PUBLIC_DISABLE_AUTH=true NEXT_PUBLIC_APP_ENV=local NEXT_PUBLIC_MOCK_SCOPES="dataset:update stac:collection:update dataset:create" yarn start'
  : 'NEXT_PUBLIC_DISABLE_AUTH=true NEXT_PUBLIC_APP_ENV=local NEXT_PUBLIC_MOCK_SCOPES="dataset:update stac:collection:update dataset:create" yarn dev';

export default defineConfig({
  testDir: './__tests__/playwright',
  webServer: {
    command: webServerCommand,
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    trace: 'retain-on-failure',
  },
  retries: 1,
  testMatch: ['**/__tests__/playwright/**/*.test.tsx'],
  timeout: 60000,
  workers: process.env.CI ? 2 : 4,
  reporter: 'html',
});

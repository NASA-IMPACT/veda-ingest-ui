import { defineConfig } from '@playwright/test';

import dotenv from 'dotenv';
dotenv.config();

const authDisabledCommand = process.env.CI
  ? 'DISABLE_AUTH=true NEXT_PUBLIC_APP_ENV=local NEXT_PUBLIC_MOCK_SCOPES="dataset:update stac:collection:update dataset:create" yarn start'
  : 'DISABLE_AUTH=true NEXT_PUBLIC_APP_ENV=local NEXT_PUBLIC_MOCK_SCOPES="dataset:update stac:collection:update dataset:create" yarn dev';

const authEnabledEnv = [
  'PORT=3001',
  'NEXTAUTH_URL=http://localhost:3001',
  'DISABLE_AUTH=false',
  'NEXT_PUBLIC_APP_ENV=local',
  'NEXTAUTH_SECRET=test-secret-for-playwright',
  'KEYCLOAK_CLIENT_ID=ingest-ui',
  'KEYCLOAK_CLIENT_SECRET=test-secret-for-playwright',
  'NEXT_PUBLIC_KEYCLOAK_ISSUER=https://example.test/realms/veda',
].join(' ');

const authEnabledCommand = process.env.CI
  ? `${authEnabledEnv} yarn start`
  : `${authEnabledEnv} yarn dev`;

export default defineConfig({
  testDir: './__tests__/playwright',
  webServer: [
    {
      command: authDisabledCommand,
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: authEnabledCommand,
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
  projects: [
    {
      name: 'default',
      use: { baseURL: 'http://localhost:3000' },
      testIgnore: ['**/MiddlewareAuth.test.tsx'],
    },
    {
      name: 'middleware',
      use: { baseURL: 'http://localhost:3001' },
      testMatch: ['**/MiddlewareAuth.test.tsx'],
    },
  ],
  use: {
    headless: true,
    trace: 'retain-on-failure',
  },
  retries: 1,
  testMatch: ['**/__tests__/playwright/**/*.test.tsx'],
  timeout: 60000,
  workers: process.env.CI ? 2 : 4,
  reporter: 'html',
});

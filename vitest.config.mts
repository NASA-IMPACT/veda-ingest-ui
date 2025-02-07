import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.tsx'],
    exclude: ['**/__tests__/playwright/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'utils/**/*.ts',
        'components/*.tsx',
        'app/**/tsx',
        'hooks/*.ts',
      ],
      exclude: [
        'tests/**',
        'mocks/**',
        'node_modules/**',
        'utils/amplify-server-util.ts',
      ], // ✅ Exclude test/mocks directories
    },
  },
});

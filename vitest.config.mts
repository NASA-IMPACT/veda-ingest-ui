import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.tsx'],
    exclude: ['**/__tests__/playwright/**', '**/node_modules/**'],
    env: {
      ENABLE_EXISTING_COLLECTION_EDIT: 'true',
      NEXT_PUBLIC_ENABLE_EXISTING_COLLECTION_EDIT: 'true',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'utils/**/*.ts',
        'utils/**/*.tsx',
        'components/**/*.tsx',
        'app/**/*.tsx',
        'hooks/**/*.ts',
        'lib/**/*.ts',
      ],
      exclude: [
        'tests/**',
        'mocks/**',
        'node_modules/**',
        'utils/amplify-server-util.ts',
        'app/**/page.tsx', // Exclude Next.js page files (thin server components)
        'app/layout.tsx', // Exclude root layout (minimal logic)
        'app/not-found.tsx', // Exclude error pages
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    server: {
      deps: {
        inline: ['next-auth', '@next-auth/core'],
      },
    },
  },
  define: {
    global: 'globalThis',
  },
});

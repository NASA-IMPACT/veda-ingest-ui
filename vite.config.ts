import type { UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import devServer from '@hono/vite-dev-server';
import { defineConfig } from 'vite';
import vike from 'vike/plugin';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import path from 'path';

export default defineConfig((options) => {
  const sharedConfig = {
    plugins: [
      vike({}),
      devServer({
        entry: 'hono-entry.ts',

        exclude: [/^\/@.+$/, /.*\.(ts|tsx|vue)($|\?)/, /.*\.(s?css|less)($|\?)/, /^\/favicon\.ico$/, /.*\.(svg|png)($|\?)/, /^\/(public|assets|static)\/.+/, /^\/node_modules\/.*/],

        injectClientScript: false,
      }),
      react({}),
      cjsInterop({
        // List of CJS dependencies that require interop
        dependencies: ['@rjsf/core', '@rjsf/antd', '@rjsf/utils', '@rjsf/validator-ajv8'],
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };

  if (options?.isSsrBuild) {
    // SSR Build
    return {
      ...sharedConfig,
      build: {
        minify: true,
        ssr: true,
        emptyOutDir: false,
        outDir: 'dist/server',
      },
    } satisfies UserConfig;
  } else {
    // Client Build
    return {
      ...sharedConfig,
      build: {
        minify: true,
        ssrManifest: true,
        emptyOutDir: false,
        outDir: 'dist/client',
      },
    } satisfies UserConfig;
  }
});

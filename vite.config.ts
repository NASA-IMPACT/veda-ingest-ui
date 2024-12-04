import react from '@vitejs/plugin-react';
import devServer from '@hono/vite-dev-server';
import { defineConfig } from 'vite';
import vike from 'vike/plugin';
import { cjsInterop } from 'vite-plugin-cjs-interop';

export default defineConfig({
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
});

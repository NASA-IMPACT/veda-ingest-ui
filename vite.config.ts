import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from "path";


// https://vitejs.dev/config/
export default defineConfig((options) => {
  // Shared Config for both Client and SSR Build
  const sharedConfig = {
    plugins: [
      react()
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
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
      ssr: {
        noExternal: ['react-tweet'],
      }
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

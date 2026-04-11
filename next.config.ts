import type { NextConfig } from 'next';
import removeImports from 'next-remove-imports';

// Environment variable validation
const requiredEnvVars = [
  'NEXT_PUBLIC_KEYCLOAK_ISSUER',
  'KEYCLOAK_CLIENT_ID',
  'APP_ID',
  'INSTALLATION_ID',
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV !== 'test') {
  console.warn(
    `⚠️  Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
  console.warn('   Please check your .env.local file');
}

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
  webpack: (config) => {
    // Ensure @rjsf/antd icons are properly resolved
    config.resolve = config.resolve || {};
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.js', '.ts', '.tsx'],
    };
    return config;
  },
};

const withRemoveImports = removeImports();

export default withRemoveImports({
  ...nextConfig,
  experimental: { esmExternals: true },
});

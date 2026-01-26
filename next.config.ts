import type { NextConfig } from 'next';

// Environment variable validation
const requiredEnvVars = [
  'NEXT_PUBLIC_KEYCLOAK_ISSUER',
  'KEYCLOAK_CLIENT_ID',
  'KEYCLOAK_CLIENT_SECRET',
  'NEXTAUTH_SECRET',
  'GITHUB_PRIVATE_KEY',
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

const removeImports = require('next-remove-imports')();
module.exports = removeImports({
  ...nextConfig,
  experimental: { esmExternals: true },
});

export default nextConfig;

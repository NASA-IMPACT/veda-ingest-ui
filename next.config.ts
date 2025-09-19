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
};

const removeImports = require('next-remove-imports')();
module.exports = removeImports({
  experimental: { esmExternals: true },
});

export default nextConfig;

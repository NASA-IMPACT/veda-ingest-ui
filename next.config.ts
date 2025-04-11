import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
};

const removeImports = require('next-remove-imports')();
module.exports = removeImports({
  experimental: { esmExternals: true },
});

export default nextConfig;

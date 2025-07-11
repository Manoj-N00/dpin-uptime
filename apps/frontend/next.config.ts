import type { NextConfig } from 'next';
import { createCivicAuthPlugin } from '@civic/auth-web3/nextjs';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Prevent Webpack from trying to bundle `pino-pretty`
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
    };

    return config;
  },
};

const withCivicAuth = createCivicAuthPlugin({
   clientId: `c6bc7d11-1503-4476-93ad-3ce1db8fa99d`,
  //clientId: `${process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID}`,
  // include: ['/dashboard/*'],
  // oauthServer is not necessary for production.
  oauthServer: process.env.AUTH_SERVER || 'https://auth.civic.com/oauth',
});

export default withCivicAuth(nextConfig);

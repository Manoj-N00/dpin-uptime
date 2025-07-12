import type { NextConfig } from 'next';
import { createCivicAuthPlugin } from '@civic/auth-web3/nextjs';

const nextConfig: NextConfig = {
  distDir: '.next',
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
    };

    return config;
  },
};

const withCivicAuth = createCivicAuthPlugin({
  clientId: `${process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID}`,
  include: ['/dashboard/*'],
  oauthServer: process.env.AUTH_SERVER || 'https://auth.civic.com/oauth',
});

export default withCivicAuth(nextConfig);

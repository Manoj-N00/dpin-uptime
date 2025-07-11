import type { NextConfig } from 'next';
import { createCivicAuthPlugin } from '@civic/auth-web3/nextjs';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  reactStrictMode: true,
  swcMinify: true,
  staticPageGenerationTimeout: 120,
  experimental: {
    // @ts-expect-error: Next.js serverActions type definition is not yet stable
    serverActions: true,
    typedRoutes: true
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
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

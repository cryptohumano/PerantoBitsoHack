/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/.well-known/did-configuration.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ];
  },
  // Asegurarnos que la ruta .well-known se sirve correctamente
  async rewrites() {
    return [
      {
        source: '/.well-known/did-configuration.json',
        destination: '/.well-known/did-configuration.json',
      },
      {
        source: '/api/payments/:path*',
        destination: 'http://localhost:4000/api/payments/:path*',
      },
      {
        source: '/api/admin/:path*',
        destination: 'http://localhost:4000/api/admin/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 
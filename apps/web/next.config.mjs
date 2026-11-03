/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/n8n/:path*',
        destination: 'http://localhost:5678/webhook/:path*',
      },
      {
        source: '/api/agent/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ];
  },
};

export default nextConfig;

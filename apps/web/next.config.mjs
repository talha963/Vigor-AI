import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.resolve(__dirname),
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/n8n/:path*',
        destination: process.env.N8N_INTERNAL_URL || 'http://localhost:5678/webhook/:path*',
      },
      {
        source: '/api/agent/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ];
  },
};

export default nextConfig;

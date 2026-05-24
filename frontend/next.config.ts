import type { NextConfig } from "next";

const apiProxy = process.env.API_PROXY_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/products/:path*",
        destination: `${apiProxy}/api/products/:path*`,
      },
      {
        source: "/api/warehouses/:path*",
        destination: `${apiProxy}/api/warehouses/:path*`,
      },
      {
        source: "/api/reservations/:path*",
        destination: `${apiProxy}/api/reservations/:path*`,
      },
      {
        source: "/api/health",
        destination: `${apiProxy}/api/health`,
      },
      {
        source: "/api/cron/:path*",
        destination: `${apiProxy}/api/cron/:path*`,
      },
    ];
  },
};

export default nextConfig;

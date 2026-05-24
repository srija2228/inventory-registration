import type { NextConfig } from "next";

const frontendOrigin = process.env.FRONTEND_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: frontendOrigin },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Idempotency-Key, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

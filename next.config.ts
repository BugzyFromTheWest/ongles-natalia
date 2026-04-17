import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ["10.0.0.208"],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://89.116.122.90:7000/:path*", // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;

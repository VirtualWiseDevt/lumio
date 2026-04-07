import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.lumiostudio.app",
        pathname: "/api/media/**",
      },
      {
        protocol: "https",
        hostname: "media.lumiostudio.app",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/api/media/**",
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.resolve.alias["pino-pretty"] = false;
    return config;
  },
  // Enable image optimization
  images: {
    formats: ["image/webp", "image/avif"],
  },
  // Silence Turbopack configuration warning
  turbopack: {},
};

export default nextConfig;

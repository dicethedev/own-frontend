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
};

export default nextConfig;

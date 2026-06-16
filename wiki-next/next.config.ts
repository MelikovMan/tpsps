import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    BUILD_STRATEGY: process.env.BUILD_STRATEGY || 'isr', // по умолчанию ISR
  },
  /* config options here */
};

export default nextConfig;

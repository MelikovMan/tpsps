import type { NextConfig } from "next";
import { RemotePattern } from "next/dist/shared/lib/image-config";


const rawUrl = process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL || 'http://localhost:9000';
// Гарантируем наличие протокола
const url = new URL(rawUrl);

// Формируем правильный объект remotePattern
const remotePattern:RemotePattern = {
  protocol: url.protocol.replace(':', '') as 'http' | 'https',
  hostname: url.hostname,
  ...(url.port ? { port: url.port } : {}), // порт только если явно задан
  pathname: '/media-files/**', // все файлы лежат в этом бакете
};

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    BUILD_STRATEGY: process.env.BUILD_STRATEGY || 'isr', // по умолчанию ISR
  },
  images: {
    remotePatterns: [
      remotePattern,
    ],
  },
  /* config options here */
};

export default nextConfig;

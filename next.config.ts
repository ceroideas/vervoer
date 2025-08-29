import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración básica
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  distDir: '.next',
};

export default nextConfig;
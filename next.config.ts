import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Comentado para desarrollo - descomenta para build estático
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
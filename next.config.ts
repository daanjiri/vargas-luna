import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
    // Or configure specific rules
    dirs: ['pages', 'utils', 'components', 'lib', 'app'],
  },
  typescript: {
    // Disable TypeScript errors during builds
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

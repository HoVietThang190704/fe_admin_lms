import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'topdev.vn',
        pathname: '/**'
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**'
      }
    ]
  }
};

export default nextConfig;

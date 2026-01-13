import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger file uploads for contact import (70k+ contacts)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'static.zara.net',
      },
      {
        protocol: 'https',
        hostname: 'image.hm.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'quickshopil-storage.s3.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;

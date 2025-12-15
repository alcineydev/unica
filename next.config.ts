import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Configuração para Turbopack (Next.js 16+)
  turbopack: {},
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default nextConfig

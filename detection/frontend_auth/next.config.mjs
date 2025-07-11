/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Be more explicit to ensure Next.js recognizes the origins
    allowedDevOrigins: ["http://localhost:3000", "http://10.2.0.2:3000"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig

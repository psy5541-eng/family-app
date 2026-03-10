/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "pub-9f988c671c3dd6cdec6bcd8d6f70d328.r2.dev",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
  serverExternalPackages: ["sharp", "better-sqlite3"],
};

export default nextConfig;

import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

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

// 로컬 개발 시 Cloudflare 바인딩 시뮬레이션 (D1, R2 등)
if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

export default nextConfig;

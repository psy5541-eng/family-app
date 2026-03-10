/** @type {import('next').NextConfig} */
const isCapacitor = process.env.CAPACITOR === "true";

const nextConfig = {
  // Capacitor APK 빌드 시: CAPACITOR=true npm run build
  ...(isCapacitor ? { output: "export" } : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
    ],
    formats: ["image/webp", "image/avif"],
    // 정적 export 모드에서는 이미지 최적화 비활성화
    ...(isCapacitor ? { unoptimized: true } : {}),
  },
  serverExternalPackages: ["sharp", "better-sqlite3"],
};

export default nextConfig;

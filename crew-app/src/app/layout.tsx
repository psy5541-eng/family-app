import type { Metadata, Viewport } from "next";
import AuthProvider from "@/components/auth/AuthProvider";
import "./globals.css";

// 다크모드 FOUC 방지: localStorage 값을 읽어 <html>에 class 즉시 적용
const themeScript = `(function(){try{var t=localStorage.getItem('crew_theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export const metadata: Metadata = {
  title: "RunningCrew",
  description: "Garmin 연동 러닝 크루 소셜 앱",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

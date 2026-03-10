import type { CapacitorConfig } from "@capacitor/cli";

// 배포 URL (Cloudflare Pages 배포 후 실제 URL로 변경)
const PRODUCTION_URL = "https://family-app-1x2.pages.dev";

// 로컬 개발 테스트용 (PC와 폰이 같은 WiFi 필요)
const DEV_URL = "http://192.168.20.33:3000";

const isDev = process.env.CAP_DEV === "true";

const config: CapacitorConfig = {
  appId: "com.lifesync.app",
  appName: "LifeSync",
  webDir: "out",
  server: {
    // 개발 시: CAP_DEV=true npx cap sync android 으로 로컬 서버 사용
    // 배포 시: PRODUCTION_URL 사용
    url: isDev ? DEV_URL : PRODUCTION_URL,
    cleartext: isDev, // HTTP 허용 (개발 전용)
  },
  android: {
    buildOptions: {
      releaseType: "APK",
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#3b82f6",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    BiometricAuth: {
      androidTitle: "LifeSync 생체인증",
      androidSubtitle: "지문 또는 얼굴 인식으로 로그인하세요",
      androidCancelButtonTitle: "취소",
      androidConfirmationRequired: false,
    },
  },
};

export default config;

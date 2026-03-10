import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lifesync.app",
  appName: "LifeSync",
  webDir: "out",   // next export 결과물 디렉터리
  server: {
    // 개발 시 로컬 Next.js 서버 사용 (핫리로드)
    // url: "http://192.168.x.x:3000",   // ← 로컬 IP로 변경
    // cleartext: true,
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

# LifeSync 설치 및 빌드 가이드

## 1. 필수 패키지 설치

```bash
cd lifesync-app

# Firebase SDK (FCM 푸시 알림)
npm install firebase

# Capacitor 코어 + Android
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor/splash-screen @capacitor/push-notifications

# 생체인증
npm install @capacitor-community/biometric-auth
```

## 2. 환경변수 설정 (.env.local)

```env
# 네이버 지도 API
NAVER_MAP_CLIENT_ID=your_naver_client_id
NAVER_MAP_CLIENT_SECRET=your_naver_client_secret

# Cloudflare R2 (선택)
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret
CLOUDFLARE_R2_BUCKET_NAME=lifesync-media

# 기상청 API (선택 - 미설정 시 mock)
WEATHER_API_KEY=your_data_go_kr_api_key

# Alpha Vantage 증시 (선택 - 미설정 시 mock)
STOCK_API_KEY=your_alpha_vantage_key

# Firebase (FCM 푸시 알림)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
FIREBASE_SERVER_KEY=your_fcm_server_key
```

## 3. 개발 서버 실행

```bash
npm run db:migrate   # 최초 1회
npm run dev          # http://localhost:3000
```

## 4. Firebase 설정 (FCM 푸시 알림)

1. [Firebase Console](https://console.firebase.google.com/) → 프로젝트 생성
2. 프로젝트 설정 → 일반 → 웹 앱 추가 → config 값 .env.local에 복사
3. Cloud Messaging 탭 → 서버 키 복사 → `FIREBASE_SERVER_KEY`
4. Cloud Messaging → Web Push certificates → VAPID Key 복사 → `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
5. `public/firebase-messaging-sw.js` 의 `self.__FIREBASE_*__` 변수를 실제 config로 교체

## 5. Android APK 빌드

### 사전 준비
- Android Studio 설치
- JDK 17+

### 빌드 단계

```bash
# 1. Capacitor Android 프로젝트 초기화 (최초 1회)
npx cap add android

# 2. APK 빌드 (정적 export + cap sync)
npm run build:apk
# → Android Studio가 자동으로 열림

# 3. Android Studio에서
#    Build → Build Bundle(s) / APK(s) → Build APK(s)
#    생성 위치: android/app/build/outputs/apk/debug/app-debug.apk
```

### 디바이스 USB 디버깅 테스트
```bash
npx cap run android
```

## 6. Firebase Push Notification Android 설정

`npx cap add android` 실행 후:
1. Firebase Console → 프로젝트 설정 → 일반 → Android 앱 추가
2. 패키지명: `com.lifesync.app`
3. `google-services.json` 다운로드 → `android/app/` 폴더에 복사

## 7. 완료된 기능

- ✅ 회원가입/로그인 (이메일 + 비밀번호, 프로필 사진)
- ✅ 생체인증 로그인 (설정에서 활성화)
- ✅ 피드 CRUD (이미지 업로드, 좋아요, 댓글, 무한스크롤)
- ✅ 캘린더 (월간, D-day, 네이버 장소 검색)
- ✅ 대시보드 (날씨 위젯, 증시 위젯, D-day 위젯)
- ✅ 설정 (프로필 수정, 다크모드, 생체인증 토글)
- ✅ FCM 푸시 알림 (서비스워커, 토큰 등록)
- ✅ Capacitor 설정 (APK 빌드 준비)

# 🏠 LifeSync - 가족 라이프스타일 앱

> 소셜 피드 + 일정관리 + 실시간 정보(날씨/증시)를 한 곳에서!

## ✨ 주요 기능

- 📸 **피드** - 가족 간 사진/글 공유 (인스타그램 스타일)
- 📅 **캘린더** - 일정 관리 & D-day
- 🗺️ **지도** - 네이버지도 연동 약속장소
- 🌤️ **날씨** - 실시간 날씨 위젯
- 📈 **증시** - 주식 시세 위젯
- 🔔 **푸시알림** - FCM 기반 알림

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 14+ (App Router) |
| Mobile | Capacitor 6+ |
| Styling | Tailwind CSS 3.4+ |
| Database | Cloudflare D1 + Drizzle ORM |
| Storage | Cloudflare R2 |
| Auth | Better Auth |
| Push | Firebase Cloud Messaging |

## 🚀 시작하기

### 1. 클론
```bash
git clone https://github.com/psy5541-eng/family-app.git
cd family-app
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정
`.env.local` 파일을 프로젝트 루트에 생성하고 필요한 API 키들을 입력하세요.
(`.env.local`은 Git에 공유되지 않으니 직접 생성해야 합니다!)

### 4. 개발 서버 실행
```bash
npm run dev
```

http://localhost:3000 에서 확인!

## 📁 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API Routes
│   ├── (auth)/         # 인증 관련 페이지
│   └── (main)/         # 메인 페이지들
├── components/          # React 컴포넌트
│   ├── feed/           # 피드 관련
│   ├── calendar/       # 캘린더 관련
│   └── ui/             # 공통 UI
├── lib/                 # 유틸리티
├── hooks/               # Custom Hooks
└── types/               # TypeScript 타입
```

## 📱 모바일 빌드 (Capacitor)

```bash
# Android
npx cap add android
npx cap open android

# iOS
npx cap add ios
npx cap open ios
```

## 📄 문서

- [Cursor 설정 가이드](./CURSOR_SETUP_GUIDE.md)
- [PRD 문서](./PRD_LifeSync_App.md)

---

Made with ❤️ for Family

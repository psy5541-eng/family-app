# LifeSync App - 프로젝트 메모리 (새 세션 시작용)

## 프로젝트 경로
- 루트: `d:/vscode/family-app/`
- 앱: `d:/vscode/family-app/lifesync-app/`

## 기술 스택
- Next.js 15.5.12 (App Router), TypeScript
- Tailwind CSS 3.4+
- DB: Drizzle ORM + better-sqlite3 (로컬) / Cloudflare D1 (프로덕션)
- 로컬 DB 파일: `lifesync-app/local.db`
- Storage: Cloudflare R2 (미설정 시 `.uploads/` 로컬 저장, `/api/media/[...path]`로 서빙)
- Auth: 커스텀 세션 (bcryptjs + localStorage `lifesync_token`)
- 이미지: Sharp WebP 변환

## 완료된 Phase
- ✅ Phase 1: Next.js 15 + Tailwind 설정
- ✅ Phase 2: Drizzle ORM + Cloudflare D1 연동 (로컬: better-sqlite3)
- ✅ Phase 3: 피드 CRUD (이미지 업로드, 좋아요, 댓글, 무한스크롤)
- ✅ Phase 4: 인증 (회원가입/로그인/로그아웃/세션/생체인증)
- ✅ Phase 5: 캘린더 CRUD + 네이버 장소 검색 + D-day
- ✅ Phase 6: 대시보드 위젯 (날씨/증시/D-day)

## 다음 Phase
- 🔜 Phase 7: FCM 푸시 알림 + Capacitor 설정 + APK 빌드

## 전체 파일 구조
```
lifesync-app/
  src/
    app/
      (auth)/login, register
      (main)/dashboard, feed, calendar, settings
      api/
        auth/[login, logout, me, register]
        feed/route.ts + [id]/[like, comments, route]
        calendar/route.ts + [id]/route.ts + dday/route.ts
        naver/place/route.ts
        upload/route.ts
        media/[...path]/route.ts   ← 로컬 미디어 서빙
        weather/route.ts           ← 기상청 API (mock 포함)
        stock/route.ts             ← Alpha Vantage (mock 포함)
    components/
      auth/[AuthProvider, BiometricButton, LoginForm, RegisterForm]
      feed/[FeedCard, FeedList, CreatePost, MediaCarousel, MediaUploader, LikeButton]
      calendar/[CalendarGrid, EventModal, PlaceSearch]
      dashboard/[WeatherWidget, StockWidget, DdayWidget]
      layout/[Header, BottomNav]
    hooks/[useAuth, useFeed, useCalendar]
    lib/
      auth/session.ts      ← Bearer token + cookie 인증
      db/[index, schema]
      r2/index.ts          ← mock → .uploads/ 저장
      utils/[date, image, rateLimit, validation]
    types/db.ts
```

## 중요 패턴 (반드시 준수)
- 인증: `getAuthHeader()` → `{ Authorization: "Bearer <token>" }` 모든 API 호출에 필수
- API 응답: `{ success: boolean, data?: T, error?: string }`
- 로컬 이미지: `/api/media/{key}` → `.uploads/{key}` 파일 서빙
- next/image: 로컬 URL은 `<img>` 태그 사용, R2 https URL만 `<Image>` 사용
- Biometric: `webpackIgnore: true` 패턴으로 동적 import (안 하면 빌드 에러)
- DB 컬럼명: snake_case (feed_id, media_url 등), Drizzle는 camelCase로 매핑

## 환경변수 (.env.local - git 제외됨, 직접 생성 필요)
```
NAVER_MAP_CLIENT_ID=your_naver_client_id
NAVER_MAP_CLIENT_SECRET=your_naver_client_secret
CLOUDFLARE_R2_ENDPOINT=your-endpoint
CLOUDFLARE_R2_ACCESS_KEY_ID=your-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret
CLOUDFLARE_R2_BUCKET_NAME=lifesync-media
WEATHER_API_KEY=your_data_go_kr_api_key
STOCK_API_KEY=your_alpha_vantage_key
```
※ 키가 placeholder이면 모두 mock 모드로 동작함

## 알려진 이슈/해결책
- BiometricButton: `webpackIgnore: true` 없으면 빌드 에러
- next/image + 로컬URL: `isRemoteUrl()` 체크 후 `<img>` vs `<Image>` 분기
- 포트 충돌 시: `taskkill //F //PID <번호>` (슬래시 두 개)
- DB 마이그레이션: `npm run db:migrate` (처음 한 번만)

## 개발 서버 시작
```bash
cd lifesync-app
npm install       # 처음 클론 시
npm run db:migrate  # DB 초기화 (처음 한 번만)
npm run dev       # http://localhost:3000
```

## Phase 7 계획
1. Firebase 프로젝트 설정 + FCM 키 발급
2. FCM 서비스워커 (`public/firebase-messaging-sw.js`)
3. 푸시 토큰 등록 API + DB 저장
4. Capacitor 설정 + 안드로이드 프로젝트 생성
5. APK 빌드 테스트

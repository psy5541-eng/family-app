# 📱 LifeSync App - Product Requirements Document (PRD)

> **Cursor AI 에이전트용 프로젝트 명세서**  
> 작성일: 2026-03-09

---

## 🎯 프로젝트 개요

**앱 이름**: LifeSync (가칭)  
**목적**: 소셜 피드 + 일정관리 + 실시간 정보(날씨/증시)를 결합한 라이프스타일 앱  
**타겟 플랫폼**: Android (Capacitor로 iOS도 빌드 가능)

---

## 🛠 기술 스택

| 카테고리 | 기술 | 비고 |
|---------|------|------|
| **프레임워크** | Next.js 14+ (App Router) | 풀스택 |
| **모바일 브릿지** | Capacitor 6+ | Android/iOS APK 빌드 |
| **스타일링** | Tailwind CSS 3.4+ | 반응형 디자인 |
| **DB** | Cloudflare D1 | SQLite 기반 |
| **ORM** | Drizzle ORM | 타입 안전성 |
| **저장소** | Cloudflare R2 | 이미지/영상 저장 |
| **인증** | Better Auth | 또는 NextAuth.js |
| **푸시 알림** | Firebase Cloud Messaging (FCM) | |
| **지도** | Naver Maps API | 장소 등록/연동 |
| **날씨** | 기상청 API (공공데이터포털) | |
| **증시** | Alpha Vantage 또는 Finnhub | |
| **이미지 처리** | Sharp | WebP 압축 |
| **배포** | Cloudflare Pages | |

---

## 📁 프로젝트 구조

```
lifesync-app/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # 인증 관련 라우트 그룹
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (main)/               # 메인 앱 라우트 그룹
│   │   │   ├── feed/
│   │   │   │   └── page.tsx
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/
│   │   │   │   └── [...all]/route.ts
│   │   │   ├── feed/
│   │   │   │   ├── route.ts          # GET (목록), POST (생성)
│   │   │   │   └── [id]/route.ts     # GET, PUT, DELETE
│   │   │   ├── calendar/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── upload/
│   │   │   │   └── route.ts          # R2 업로드
│   │   │   ├── weather/
│   │   │   │   └── route.ts
│   │   │   ├── stock/
│   │   │   │   └── route.ts
│   │   │   └── fcm/
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx              # 리다이렉트 또는 랜딩
│   │
│   ├── components/
│   │   ├── ui/                   # 공통 UI 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── Loading.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── BiometricButton.tsx
│   │   ├── feed/
│   │   │   ├── FeedCard.tsx
│   │   │   ├── FeedList.tsx
│   │   │   ├── CreatePost.tsx
│   │   │   ├── MediaUploader.tsx
│   │   │   └── LikeButton.tsx
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx
│   │   │   ├── EventModal.tsx
│   │   │   ├── EventCard.tsx
│   │   │   ├── DdayBadge.tsx
│   │   │   └── LocationPicker.tsx
│   │   ├── dashboard/
│   │   │   ├── WeatherWidget.tsx
│   │   │   ├── StockWidget.tsx
│   │   │   └── QuickStats.tsx
│   │   └── layout/
│   │       ├── BottomNav.tsx
│   │       ├── Header.tsx
│   │       └── Sidebar.tsx
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts          # Drizzle 클라이언트
│   │   │   ├── schema.ts         # 테이블 스키마
│   │   │   └── migrations/
│   │   ├── auth/
│   │   │   └── index.ts          # Better Auth 설정
│   │   ├── r2/
│   │   │   └── index.ts          # R2 업로드 유틸
│   │   ├── fcm/
│   │   │   └── index.ts          # FCM 유틸
│   │   ├── api/
│   │   │   ├── weather.ts        # 기상청 API
│   │   │   ├── stock.ts          # 증시 API
│   │   │   └── naver-map.ts      # 네이버지도 API
│   │   └── utils/
│   │       ├── image.ts          # Sharp 이미지 처리
│   │       ├── date.ts           # 날짜/D-day 계산
│   │       └── validation.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useFeed.ts
│   │   ├── useCalendar.ts
│   │   ├── useBiometric.ts
│   │   └── useFCM.ts
│   │
│   ├── types/
│   │   ├── user.ts
│   │   ├── feed.ts
│   │   ├── calendar.ts
│   │   └── api.ts
│   │
│   └── styles/
│       └── components.css
│
├── android/                      # Capacitor Android 프로젝트
├── ios/                          # Capacitor iOS 프로젝트 (선택)
├── public/
│   ├── icons/
│   └── images/
│
├── capacitor.config.ts
├── drizzle.config.ts
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── wrangler.toml                 # Cloudflare 설정
└── .env.local                    # 환경변수
```

---

## 📊 데이터베이스 스키마 (Drizzle ORM)

```typescript
// src/lib/db/schema.ts

import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';

// ==================== USERS ====================
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // 해시된 비밀번호 (최소 8자)
  nickname: text('nickname').notNull(),
  profileImage: text('profile_image'), // R2 URL
  role: text('role').default('user'), // 'admin' | 'user'
  biometricEnabled: integer('biometric_enabled', { mode: 'boolean' }).default(false),
  fcmToken: text('fcm_token'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ==================== FEEDS ====================
export const feeds = sqliteTable('feeds', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ==================== FEED MEDIA ====================
export const feedMedia = sqliteTable('feed_media', {
  id: text('id').primaryKey(),
  feedId: text('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  mediaUrl: text('media_url').notNull(), // R2 URL
  mediaType: text('media_type').notNull(), // 'image' | 'video'
  order: integer('order').default(0),
});

// ==================== FEED LIKES ====================
export const feedLikes = sqliteTable('feed_likes', {
  id: text('id').primaryKey(),
  feedId: text('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ==================== FEED COMMENTS ====================
export const feedComments = sqliteTable('feed_comments', {
  id: text('id').primaryKey(),
  feedId: text('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ==================== CALENDAR EVENTS ====================
export const calendarEvents = sqliteTable('calendar_events', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }),
  isAllDay: integer('is_all_day', { mode: 'boolean' }).default(false),
  isDday: integer('is_dday', { mode: 'boolean' }).default(false), // D-day 표시 여부
  // 위치 정보 (네이버지도 연동)
  placeName: text('place_name'),
  placeAddress: text('place_address'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  naverPlaceId: text('naver_place_id'), // 네이버지도 장소 ID
  // 알림 설정
  notifyBefore: integer('notify_before'), // 분 단위 (예: 30 = 30분 전)
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ==================== NOTIFICATIONS ====================
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'feed' | 'calendar' | 'system'
  title: text('title').notNull(),
  body: text('body').notNull(),
  data: text('data'), // JSON string
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

---

## 🔐 기능 상세 명세

### 1. 인증 (Authentication)

#### 1.1 로그인
```typescript
// 요구사항
- 이메일/비밀번호 로그인
- 비밀번호 최소 8자리 (대문자, 소문자, 숫자, 특수문자 중 2가지 이상)
- 자동 로그인 (토큰 저장)
- 로그인 실패 시 횟수 제한 (5회 실패 시 5분 잠금)

// Biometric Auth (Capacitor)
- @capacitor-community/biometric-auth 플러그인 사용
- 기기 지원 여부 체크 후 활성화
- 지문/Face ID 인증 성공 시 저장된 토큰으로 자동 로그인
```

#### 1.2 회원가입
```typescript
// 필수 입력 필드
- 이메일 (중복 체크)
- 비밀번호 (최소 8자, 강도 표시)
- 비밀번호 확인
- 닉네임 (2~20자, 중복 체크)
- 프로필 사진 (선택, R2 업로드)

// 프로필 사진 처리
- Sharp로 WebP 변환
- 최대 500x500px 리사이즈
- 품질 80%
```

---

### 2. 피드 (Feed) - 인스타그램 스타일

#### 2.1 피드 목록
```typescript
// UI 구성
- 무한 스크롤 (Intersection Observer)
- 각 피드 카드:
  ├── 상단: 프로필 사진 + 닉네임 + 작성 시간
  ├── 중앙: 미디어 (사진/영상 캐러셀)
  ├── 하단: 좋아요 버튼, 댓글 버튼, 좋아요 수
  └── 텍스트 내용 (더보기 처리)

// API
GET /api/feed?cursor={lastId}&limit=10
Response: { feeds: Feed[], nextCursor: string | null }
```

#### 2.2 피드 작성
```typescript
// 업로드 제한
- 최대 10장 이미지 또는 1개 영상
- 이미지: 최대 10MB → Sharp로 WebP 압축 (품질 85%, 최대 1080px)
- 영상: 최대 100MB (Cloudflare Stream 고려 가능)

// 업로드 플로우
1. 클라이언트에서 파일 선택
2. POST /api/upload (presigned URL 또는 직접 업로드)
3. Sharp 처리 후 R2 저장
4. 피드 생성 시 미디어 URL 연결

// FCM 알림
- 새 피드 작성 시 모든 사용자에게 푸시 알림
- "닉네임님이 새 게시물을 올렸습니다"
```

---

### 3. 캘린더 (Calendar)

#### 3.1 캘린더 뷰
```typescript
// UI
- 월간/주간/일간 뷰 전환
- 일정 있는 날짜에 도트 표시
- 날짜 클릭 시 해당 일정 목록 표시
- 라이브러리: react-calendar 또는 @fullcalendar/react

// D-day 기능
- 특정 일정을 D-day로 설정 가능
- 메인 대시보드에 D-day 위젯 표시
- D-3, D-day, D+2 형식으로 표시
```

#### 3.2 일정 등록/수정
```typescript
// 입력 필드
- 제목 (필수)
- 설명 (선택)
- 시작일시 / 종료일시
- 종일 여부
- D-day 설정 여부
- 장소 (네이버지도 연동)
- 알림 설정 (없음/10분전/30분전/1시간전/1일전)

// 네이버지도 연동
1. @maptiler/sdk 또는 네이버 지도 JavaScript API
2. 장소 검색 API로 장소 선택
3. 저장 시 좌표 + 장소명 + 네이버 Place ID 저장
4. 클릭 시 네이버지도 앱 딥링크로 이동
   - Android: nmap://place?lat={}&lng={}&name={}
   - iOS: nmap://place?lat={}&lng={}&name={}

// FCM 알림
- 일정 등록 시 모든 사용자에게 알림
- 일정 시작 전 설정된 시간에 리마인더 알림
```

---

### 4. 대시보드 (Dashboard)

#### 4.1 날씨 위젯
```typescript
// 기상청 API (공공데이터포털)
- 초단기실황, 단기예보 API 사용
- API Key 필요 (data.go.kr 발급)

// 표시 정보
- 현재 온도
- 체감 온도
- 날씨 상태 (맑음/흐림/비/눈 등)
- 아이콘
- 오늘의 최저/최고 온도
- 시간대별 예보 (12시간)

// 위치
- Capacitor Geolocation으로 현재 위치 가져오기
- 위경도 → 기상청 격자 좌표 변환 필요
```

#### 4.2 증시 위젯
```typescript
// Alpha Vantage 또는 Finnhub API
- API Key 필요

// 표시 정보
- KOSPI / KOSDAQ 지수
- 전일 대비 등락률
- 주요 종목 (삼성전자, SK하이닉스 등) 간단 표시
- 새로고침 버튼

// 업데이트 주기
- 장 중: 1분 간격
- 장 마감 후: 표시 고정
```

#### 4.3 D-day 위젯
```typescript
// 표시
- D-day로 설정된 일정들 목록
- D-n 또는 D+n 형식
- 클릭 시 해당 일정 상세로 이동
```

---

## 📱 Capacitor 설정

### capacitor.config.ts
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.lifesync',
  appName: 'LifeSync',
  webDir: 'out', // Next.js static export
  server: {
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    BiometricAuth: {
      allowDeviceCredential: true,
    },
  },
};

export default config;
```

### 필요한 Capacitor 플러그인
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npm install @capacitor/push-notifications
npm install @capacitor/geolocation
npm install @capacitor/camera
npm install @capacitor/filesystem
npm install @capacitor-community/biometric-auth
npm install @capawesome/capacitor-app-update # 앱 업데이트 체크 (선택)
```

---

## 🎨 UI/UX 가이드라인

### 반응형 Tailwind 설정
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      screens: {
        'fold': '280px',      // 폴드 접힌 상태
        'mobile': '360px',    // 일반 모바일
        'mobile-lg': '412px', // 큰 모바일
        'fold-open': '768px', // 폴드 펼친 상태
        'tablet': '1024px',
      },
    },
  },
};

// 사용 예시
<div className="
  grid grid-cols-1 
  fold:grid-cols-1 
  mobile:grid-cols-1 
  fold-open:grid-cols-2 
  tablet:grid-cols-3
">
```

### 컬러 팔레트 (예시)
```typescript
colors: {
  primary: {
    50: '#f0f9ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  secondary: {
    500: '#8b5cf6',
  },
  // 다크모드 지원
}
```

### 바텀 네비게이션
```typescript
// 구성
- 홈 (대시보드)
- 피드
- + (새 글 작성 - FAB 스타일)
- 캘린더
- 설정/프로필
```

---

## 🔧 환경변수 (.env.local)

```env
# Database
CLOUDFLARE_D1_DATABASE_ID=your_d1_database_id
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# Storage
CLOUDFLARE_R2_BUCKET_NAME=lifesync-media
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Auth
BETTER_AUTH_SECRET=your_secret_key_min_32_chars
BETTER_AUTH_URL=https://your-domain.com

# FCM
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# APIs
WEATHER_API_KEY=your_data_go_kr_api_key
STOCK_API_KEY=your_alpha_vantage_or_finnhub_key
NAVER_MAP_CLIENT_ID=your_naver_client_id
NAVER_MAP_CLIENT_SECRET=your_naver_client_secret

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 📋 개발 순서 권장

### Phase 1: 기본 설정 (1-2일)
1. Next.js 프로젝트 생성 + Tailwind 설정
2. Drizzle ORM + D1 연동 및 마이그레이션
3. R2 연동 및 업로드 유틸 구현
4. 기본 레이아웃 (바텀 네비 포함)

### Phase 2: 인증 (2-3일)
1. Better Auth 설정
2. 회원가입 페이지 + API
3. 로그인 페이지 + API
4. 프로필 이미지 업로드

### Phase 3: 피드 (3-4일)
1. 피드 목록 페이지
2. 피드 작성 페이지 + 미디어 업로드
3. Sharp 이미지 처리
4. 좋아요/댓글 기능

### Phase 4: 캘린더 (3-4일)
1. 캘린더 뷰 컴포넌트
2. 일정 CRUD
3. 네이버지도 연동
4. D-day 기능

### Phase 5: 대시보드 (2-3일)
1. 날씨 위젯 (기상청 API)
2. 증시 위젯
3. D-day 위젯
4. 대시보드 레이아웃

### Phase 6: 알림 & 모바일 (2-3일)
1. FCM 설정 및 푸시 알림
2. Capacitor 설정
3. Biometric Auth
4. APK 빌드 테스트

### Phase 7: 마무리 (2-3일)
1. 반응형 최적화 (폴드 대응)
2. 에러 핸들링 & 로딩 상태
3. 테스트 및 버그 수정
4. Cloudflare Pages 배포

---

## ⚠️ 주의사항

### 아이폰 지원 여부
- **가능합니다!** Capacitor는 Android와 iOS 모두 지원
- iOS 빌드를 위해서는:
  - macOS 필요 (Xcode)
  - Apple Developer 계정 ($99/년)
  - `npx cap add ios` 실행

### Cloudflare Pages + Next.js
- `next.config.js`에서 `output: 'export'` 필요 (정적 빌드)
- 또는 `@cloudflare/next-on-pages` 사용 (서버 기능 유지)
- API Routes 사용 시 Edge Runtime 고려

### 네이버지도 API
- 네이버 클라우드 플랫폼에서 Application 등록 필요
- Android/iOS 패키지명 등록 필요
- 월 무료 할당량 확인

---

## 🚀 Cursor AI에게 전달할 초기 프롬프트 예시

```
위 PRD 문서를 기반으로 LifeSync 앱을 구현해주세요.

현재 상태:
- Cloudflare D1 데이터베이스 생성 완료
- Cloudflare R2 버킷 생성 완료  
- GitHub 레포지토리 준비 완료

시작해야 할 것:
1. Next.js 14 프로젝트를 App Router로 생성
2. Tailwind CSS, Drizzle ORM 설정
3. DB 스키마 생성 및 마이그레이션
4. 기본 폴더 구조 세팅

한 단계씩 진행하면서 확인받겠습니다.
```

---

## 📎 참고 링크

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Capacitor 공식 문서](https://capacitorjs.com/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Better Auth](https://www.better-auth.com/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [기상청 API](https://www.data.go.kr/)
- [네이버 지도 API](https://www.ncloud.com/product/applicationService/maps)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

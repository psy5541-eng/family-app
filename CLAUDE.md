# LifeSync App - Cursor AI Rules

## 프로젝트 개요
소셜 피드 + 일정관리 + 실시간 정보(날씨/증시) 라이프스타일 앱

## 기술 스택 (반드시 준수)
- Framework: Next.js 14+ (App Router)
- Mobile: Capacitor 6+
- Styling: Tailwind CSS 3.4+
- DB: Cloudflare D1 + Drizzle ORM
- Storage: Cloudflare R2
- Auth: Better Auth
- Push: Firebase Cloud Messaging

## 코딩 규칙

### 파일/폴더 구조
- 컴포넌트: src/components/{feature}/{ComponentName}.tsx
- API Routes: src/app/api/{feature}/route.ts
- 유틸리티: src/lib/{category}/{name}.ts
- 타입: src/types/{name}.ts
- 훅: src/hooks/use{Name}.ts

### TypeScript
- 모든 파일 TypeScript 사용 (.ts, .tsx)
- any 타입 금지 - 명시적 타입 정의
- interface보다 type 선호
- 컴포넌트 props는 type으로 정의

### React/Next.js
- 함수형 컴포넌트만 사용
- 'use client' 필요한 경우에만 명시
- Server Components 우선 사용
- 이미지는 next/image 사용

### 스타일링
- Tailwind CSS만 사용 (인라인 스타일 금지)
- 반응형: fold → mobile → fold-open → tablet 순서
- 다크모드 고려: dark: 프리픽스

### 네이밍
- 컴포넌트: PascalCase (FeedCard.tsx)
- 함수/변수: camelCase
- 상수: UPPER_SNAKE_CASE
- 타입: PascalCase with Type/Props suffix

### API
- RESTful 규칙 준수
- 에러 핸들링 필수
- 응답 형식 통일: { success: boolean, data?: T, error?: string }

### 보안
- 환경변수는 .env.local에만 저장
- 클라이언트 노출 변수는 NEXT_PUBLIC_ 프리픽스
- API 키 절대 하드코딩 금지

## 주요 기능 체크리스트
- [ ] 회원가입/로그인 (비밀번호 8자 이상)
- [ ] 지문인식 (Capacitor Biometric)
- [ ] 피드 CRUD (이미지 WebP 압축)
- [ ] 캘린더 일정 관리
- [ ] 네이버지도 연동
- [ ] D-day 기능
- [ ] 날씨 위젯 (기상청 API)
- [ ] 증시 위젯 (Alpha Vantage)
- [ ] FCM 푸시 알림

## 참고 문서
- PRD: PRD_LifeSync_App.md
- API Keys: .env.local (gitignore 필수!)

## 질문 시 행동
1. 구현 전 접근 방식 먼저 설명
2. 한 번에 하나의 기능만 구현
3. 테스트 가능한 단위로 커밋 제안
4. 에러 발생 시 해결책 3가지 제시

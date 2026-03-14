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

---

# Crew App (crew-app/) - RunningCrew

## 프로젝트 개요
러닝크루 관리 앱 (같은 repo, 별도 Next.js 프로젝트)

## 배포
- Cloudflare Pages: `family-app` (GitHub-connected, git push = auto deploy)
- Production URL: `family-app-1x2.pages.dev`
- D1 database: `crew-app`, ID: `70a2554e-9c09-41e9-baee-a07837837987` (절대 변경 금지!)
- Build: `npm run build:cloudflare` (@opennextjs/cloudflare)
- D1 migrations: `npx wrangler d1 execute crew-app --remote --file=<path>`

## Garmin 연동 (절대 변경 금지 규칙)

### 원본 거리 공식 (편집 방지)
- `splitSummaries.INTERVAL_ACTIVE.distance` = 원본 GPS 거리 (이것만 사용!)
- `getActivities().distance` = 편집된 값 (사용 금지)
- `averageSpeed` = 편집 시 재계산됨 (사용 금지)
- **이 공식은 절대 변경하지 말 것**

### API 엔드포인트
- 활동 목록: `GC.getActivities(0, count)`
- 활동 상세: `GC.getActivity({ activityId })`
- 랩 데이터: `GC.get("https://connectapi.garmin.com/activity-service/activity/{id}/splits")`
  - 반드시 `connectapi.garmin.com` 사용 (`connect.garmin.com/proxy/...`는 빈 객체 반환)

### Rate Limiting 주의
- sso.garmin.com 로그인에 Cloudflare 리밋 적용
- 1~2분 내 5회+ 로그인 시 429 ban (15분~1시간+)
- **테스트 시 반복 로그인 절대 금지** — 1번 로그인 후 세션 유지하며 테스트
- 데이터 API 호출은 리밋 없음

### 활동 필터링 (조작 감지)
- manualActivity === true → 제외
- deviceId 없음 → 제외
- startTimeGMT vs startTimeLocal > 14시간 차이 → 제외
- beginTimestamp vs startTimeLocal > 24시간 차이 → 제외

## 핵심 파일
- `src/lib/garmin/client.ts` — Garmin 데이터 수집 (핵심 로직)
- `src/lib/garmin/crypto.ts` — AES 암호화
- `src/lib/garmin/points.ts` — 포인트 계산
- `src/app/api/garmin/sync/route.ts` — 동기화 API
- `src/app/(main)/activities/[id]/page.tsx` — 활동 상세 + 랩 차트
- `src/components/common/LoadingOverlay.tsx` — 공통 로딩 오버레이
- `src/components/layout/Header.tsx` — 헤더 (설정 톱니바퀴)

## DB 테스트 리셋 (동기화 재테스트 시)
```sql
DELETE FROM activities WHERE user_id = '<userId>';
DELETE FROM point_transactions WHERE user_id = '<userId>';
UPDATE user_points SET current_points = 0, total_earned = 0 WHERE user_id = '<userId>';
UPDATE garmin_accounts SET last_sync_at = NULL WHERE user_id = '<userId>';
```

## 미해결 이슈
- shop/route.ts: `character` 변수 중복 선언 빌드 에러
- Character selection flow: 신규 유저 unknown → /character-select 이동
- idle 헤어 에셋 아직 미적용 (run만 완료)
- 상의/하의/신발 레이어 에셋 아직 미작업

## 진행상황 (2026-03-12)

### 완료
- Garmin 원본 GPS 거리 사용 (splitSummaries.INTERVAL_ACTIVE.distance) — 편집 방지 완료
- Garmin splits API URL 수정: `connectapi.garmin.com` (proxy URL은 빈 객체 반환)
- 랩 페이스 바 차트 UI (활동 상세 페이지, 최고 랩 빨간색/일반 파란색)
- activities 테이블 laps TEXT 컬럼 추가 + 동기화 시 JSON 저장
- Header: 프로필/로그아웃 제거 → 설정 톱니바퀴 아이콘 추가
- LoadingOverlay 공통 컴포넌트 (동기화, 연동, 삭제 시 전체화면 블라인드)
- CLAUDE.md에 crew-app 핵심 정보 추가 (회사/집 공유용)

### 확인 완료
- splitSummaries 원본 거리: 15.48km (편집값 16.48km과 구분 성공)
- splits API lapDTOs: km별 랩 데이터 정상 수신 확인
- 동기화 시 laps 데이터 DB 저장 + 상세 페이지 렌더링 정상
- LoadingOverlay 스피너 + 메시지 + 클릭 차단 정상

## 진행상황 (2026-03-13)

### 완료
- 캐릭터 페이퍼돌 레이어 시스템 구축 (CharacterAvatar 컴포넌트)
  - 레이어 순서: base(대머리) → shoes → bottom → top → hair → hat
  - 스프라이트: 256x64 PNG (4프레임 × 64x64), CSS steps(4) 애니메이션
- 로그인 페이지 남녀 캐릭터에 run 헤어 적용 (`equipment={{ hair: "default" }}`)
- sprite-pipeline.cjs에 `extract-hair` 명령어 추가 (대머리 vs 헤어 diff 추출)
- run 헤어 에셋 완료 (한뭉탱이 스타일 — 얼굴+머리 통이미지)
  - `public/assets/character/hair/default-run-male.png` (수작업)
  - `public/assets/character/hair/default-run-female.png` (수작업)
- PIXELLAB_PROMPTS.md 작성 (PixelLab 프롬프트 + Gemini 분리 워크플로우)
- Gemini 이미지 → 256x64 nearest-neighbor 리사이즈 다수 처리

### 결정사항
- 머리카락 분리: 섬세하게 따는 것 비현실적 → **한뭉탱이(얼굴+머리 통이미지)로 확정**
- 에셋 생성 워크플로우: PixelLab 스프라이트 → Gemini로 부위 분리 → Claude로 리사이즈/후처리
- PixelPartExtractor(Lang-SAM 웹앱) 검토 → 64x64에서 비실용적, 기각

### 미커밋 변경사항 (커밋 필요!)
- LoginForm.tsx: 남녀 헤어 equipment 추가
- sprite-pipeline.cjs: extract-hair 명령어 추가
- public/assets/character/hair/: run 헤어 남녀
- assets-raw/hair/: Gemini 원본 + 리사이즈 파일들
- PIXELLAB_PROMPTS.md (에셋 제작 가이드)

## 진행상황 (2026-03-14)

### 완료
- **가민 세션 캐싱 (OAuth 토큰)**
  - garmin_accounts 테이블에 encrypted_oauth1, encrypted_oauth2, oauth2_expires_at, status 컬럼 추가
  - 첫 로그인 시 토큰 export → AES 암호화 → DB 저장
  - 이후 동기화 시 저장된 토큰으로 재사용 (로그인 생략)
  - 토큰 만료/무효 시 비밀번호로 재로그인 → 새 토큰 저장
  - 재로그인도 실패 시 status='reauth_required'로 변경
  - **rate limit 위험 사실상 제거** (로그인 대신 토큰 사용)
- **대시보드 가민 연동 팝업**
  - 미연동 유저: 앱 접속 시 "가민 연동하기" 레이어 팝업 (나중에/연동하러가기)
  - 재인증 필요: 빨간 배너 "가민 재연동이 필요합니다"
  - 연동+정상: 앱 접속 시 자동 동기화 (결과 배너 표시)
- **고도 차트 (SVG area chart)**
  - details API로 포인트별 고도 데이터 수집 (distance/elevation)
  - activities 테이블에 elevation_data TEXT 컬럼 추가
  - 동기화 시 최대 200포인트 샘플링하여 저장
  - 활동 상세 페이지 하단에 녹색 area chart 표시
- **랩 테이블 + 탭 전환**
  - 페이스 영역에 "차트/테이블" 탭 전환 UI
  - 테이블: 랩번호/시간/거리/평균페이스 (가민앱 스타일)
  - 최고 랩 빨간색 하이라이트

### DB 마이그레이션
- `0004_garmin_oauth_tokens.sql`: encrypted_oauth1, encrypted_oauth2, oauth2_expires_at, status
- `0005_activities_elevation_data.sql`: elevation_data

### 테스트 계정
- App: psy5541@gmail.com / userId: 5ba052bb-ce0b-49be-8289-7447d2f242a5
- Garmin: zzo777@naver.com (위 계정에 연동됨)

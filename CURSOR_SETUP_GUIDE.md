# 🖥️ Cursor 설치 & GitHub 연결 가이드

---

## 1️⃣ Cursor 설치

1. **다운로드**: https://cursor.sh
2. 설치 파일 실행
3. VS Code 설정 가져오기 여부 → 있으면 가져오기, 없으면 스킵
4. 로그인 (GitHub 또는 Google 계정)

---

## 2️⃣ GitHub 연결

### 방법 A: Cursor에서 바로 클론
```
1. Cursor 실행
2. Ctrl + Shift + P (맥: Cmd + Shift + P)
3. "Git: Clone" 입력 후 선택
4. GitHub 레포 URL 입력: https://github.com/너의유저명/레포이름
5. 저장할 폴더 선택
6. GitHub 로그인 팝업 → 승인
```

### 방법 B: 터미널에서 클론 후 열기
```bash
# 원하는 폴더로 이동
cd ~/Projects

# 클론
git clone https://github.com/너의유저명/레포이름

# Cursor로 열기
cursor 레포이름
```

---

## 3️⃣ Cursor AI 에이전트 설정 (★중요★)

### .cursorrules 파일 생성
프로젝트 루트에 `.cursorrules` 파일 만들면 **Git으로 공유됨!**

```bash
# 프로젝트 루트에서
touch .cursorrules
```

### .cursorrules 내용 (아래 복붙)

```markdown
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
```

---

## 4️⃣ 프로젝트 초기 파일 구조

```bash
# 프로젝트 루트에 생성할 파일들
lifesync-app/
├── .cursorrules          # ⭐ AI 에이전트 설정 (Git 공유됨!)
├── .gitignore            # Git 제외 파일
├── .env.local            # 환경변수 (Git 제외!)
├── PRD_LifeSync_App.md   # PRD 문서
└── README.md             # 프로젝트 설명
```

---

## 5️⃣ .gitignore 설정

```gitignore
# dependencies
node_modules
.pnp
.pnp.js

# testing
coverage

# next.js
.next/
out/

# production
build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files (중요!)
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# capacitor
android/
ios/
*.keystore

# IDE
.idea/
.vscode/
*.swp
*.swo
```

---

## 6️⃣ 오늘 할 일 체크리스트

```
[ ] 1. Cursor 설치
[ ] 2. GitHub 로그인 연결
[ ] 3. 레포 클론 (빈 레포면 로컬에서 생성)
[ ] 4. .cursorrules 파일 생성 (위 내용 복붙)
[ ] 5. .gitignore 파일 생성
[ ] 6. PRD_LifeSync_App.md 복사
[ ] 7. .env.local 복사 (gitignore 확인!)
[ ] 8. 첫 커밋 & 푸시
```

### 터미널 명령어 (순서대로)
```bash
# 1. 프로젝트 폴더로 이동
cd ~/Projects/lifesync-app  # 또는 클론한 폴더

# 2. 파일들 생성 후...

# 3. Git 상태 확인
git status

# 4. .env.local이 목록에 없는지 확인! (있으면 .gitignore 문제)

# 5. 스테이징
git add .

# 6. 커밋
git commit -m "🎉 Initial setup: cursorrules, gitignore, PRD"

# 7. 푸시
git push origin main
```

---

## 7️⃣ 내일 회사/집에서 동기화

### 회사에서 (GitLab 미러링 or GitHub 직접)
```bash
# GitHub에서 클론
git clone https://github.com/너의유저명/레포이름
cd 레포이름

# .env.local은 Git에 없으니 직접 생성
# (파일 내용은 안전한 곳에 따로 보관해둬야 함)

# 작업 후 푸시
git add .
git commit -m "feat: 작업내용"
git push
```

### 집에서 받기
```bash
cd ~/Projects/lifesync-app
git pull origin main
```

---

## ✅ 공유되는 것 vs 안 되는 것

| 파일 | Git 공유 | 설명 |
|------|----------|------|
| `.cursorrules` | ✅ 공유됨 | AI 에이전트 설정 |
| `PRD_LifeSync_App.md` | ✅ 공유됨 | 기획 문서 |
| `.gitignore` | ✅ 공유됨 | |
| `소스코드 전체` | ✅ 공유됨 | |
| `.env.local` | ❌ 공유안됨 | API 키 (각 환경에서 직접 생성) |
| `node_modules` | ❌ 공유안됨 | npm install로 설치 |
| `android/ios` | ❌ 공유안됨 | 빌드 시 생성 |

---

## 💡 팁: .env.local 공유 방법

Git에는 안 올리지만, 여러 환경에서 써야 하니까:

1. **Notion/메모장에 저장** - 본인만 볼 수 있는 곳
2. **1Password/Bitwarden** - 비밀번호 관리 앱
3. **카톡 나에게 보내기** - 임시 방편 ㅋㅋ

⚠️ 절대 슬랙/디스코드 같은 데 올리지 마세요!

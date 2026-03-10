# 📋 LifeSync 프로젝트 규칙

> Claude Code가 항상 참조해야 할 규칙들

---

## 🔄 작업 진행 규칙

### 매 작업 시 표시
1. **진행률**: PRD 기준 현재 Phase와 % 표시
2. **체크리스트**: 완료된 기능 ✅ / 미완료 ⬜ 표시
3. **코드 리뷰**: 파일 작성 후 간단한 품질 점검

### 진행률 포맷
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 진행률: Phase 1 - 기본 설정 (40%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Next.js 프로젝트 생성
✅ Tailwind CSS 설정
⬜ Drizzle ORM 연동
⬜ 기본 레이아웃
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📁 Phase 체크리스트

### Phase 1: 기본 설정 (1-2일)
- [ ] Next.js 14 프로젝트 생성 (App Router)
- [ ] Tailwind CSS 설정
- [ ] Drizzle ORM + D1 연동
- [ ] R2 연동 및 업로드 유틸
- [ ] 기본 레이아웃 (바텀 네비)

### Phase 2: 인증 (2-3일)
- [ ] Better Auth 설정
- [ ] 회원가입 페이지 + API
- [ ] 로그인 페이지 + API
- [ ] 프로필 이미지 업로드

### Phase 3: 피드 (3-4일)
- [ ] 피드 목록 페이지
- [ ] 피드 작성 + 미디어 업로드
- [ ] Sharp 이미지 처리
- [ ] 좋아요/댓글 기능

### Phase 4: 캘린더 (3-4일)
- [ ] 캘린더 뷰 컴포넌트
- [ ] 일정 CRUD
- [ ] 네이버지도 연동
- [ ] D-day 기능

### Phase 5: 대시보드 (2-3일)
- [ ] 날씨 위젯 (기상청 API)
- [ ] 증시 위젯
- [ ] D-day 위젯

### Phase 6: 알림 & 모바일 (2-3일)
- [ ] FCM 푸시 알림
- [ ] Capacitor 설정
- [ ] Biometric Auth
- [ ] APK 빌드 테스트

### Phase 7: 마무리 (2-3일)
- [ ] 반응형 최적화
- [ ] 에러 핸들링
- [ ] 테스트 및 버그 수정
- [ ] Cloudflare Pages 배포

---

## ✅ 코드 리뷰 체크리스트

매 파일 작성 후 확인:

### 필수 점검
- [ ] TypeScript 타입 명시 (any 금지)
- [ ] 에러 핸들링 있음
- [ ] 환경변수 하드코딩 없음
- [ ] console.log 제거

### 스타일
- [ ] Tailwind CSS만 사용
- [ ] 반응형 고려 (fold → mobile → tablet)
- [ ] 다크모드 대응 (dark: 프리픽스)

### 보안
- [ ] API 키 노출 없음
- [ ] 인증 체크 있음 (필요한 경우)
- [ ] 입력값 검증

### 리뷰 포맷
```
📝 코드 리뷰: {파일명}
━━━━━━━━━━━━━━━━━━
✅ 타입 안전성: OK
✅ 에러 핸들링: OK
⚠️ 개선 제안: {내용}
점수: 85/100
━━━━━━━━━━━━━━━━━━
```

---

## 🔧 기술 스택 준수

| 항목 | 사용 기술 | 주의사항 |
|------|----------|----------|
| Framework | Next.js 14+ (App Router) | pages/ 사용 금지 |
| Styling | Tailwind CSS 3.4+ | 인라인 스타일 금지 |
| DB | Cloudflare D1 + Drizzle | |
| Storage | Cloudflare R2 | |
| Auth | Better Auth | |
| Push | Firebase FCM | |
| Map | Naver Maps API | |

---

## 📂 폴더 구조 규칙

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # 인증 라우트 그룹
│   ├── (main)/         # 메인 라우트 그룹
│   └── api/            # API Routes
├── components/
│   ├── ui/             # 공통 UI
│   └── {feature}/      # 기능별 컴포넌트
├── lib/                # 유틸리티
├── hooks/              # Custom Hooks
└── types/              # TypeScript 타입
```

---

## 🚨 금지 사항

1. **any 타입 사용 금지**
2. **API 키 하드코딩 금지**
3. **인라인 스타일 금지** (Tailwind만)
4. **class 컴포넌트 금지** (함수형만)
5. **pages/ 디렉토리 금지** (App Router만)

---

## 💬 커밋 메시지 규칙

```
✨ feat: 새 기능
🐛 fix: 버그 수정
💄 style: UI/스타일
♻️ refactor: 리팩토링
📝 docs: 문서
🔧 chore: 설정
```

---

## 🔗 참조 문서

- `PRD_LifeSync_App.md` - 상세 기획서
- `API_KEY_GUIDE.md` - API 키 발급 가이드
- `.env.local` - 환경변수 (Git 제외)

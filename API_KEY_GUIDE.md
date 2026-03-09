# 🔑 API Key 발급 가이드 & 환경변수 템플릿

> 모든 서비스는 **무료 티어**로 사용 가능합니다.

---

## 📋 환경변수 템플릿 (.env.local)

아래 내용을 `.env.local` 파일에 복사하고 빈칸을 채워주세요.

```env
# ============================================
# 🌐 CLOUDFLARE (D1 + R2)
# ============================================
# 📍 발급처: https://dash.cloudflare.com
# 💰 무료: D1 무료 티어 (5GB), R2 무료 티어 (10GB 저장/월 1천만 요청)
# 
# [발급 방법]
# 1. Cloudflare 대시보드 → Workers & Pages → D1 → 데이터베이스 선택
# 2. Database ID 복사
# 3. 우측 상단 프로필 → My Profile → API Tokens → Create Token
# 4. "Edit Cloudflare Workers" 템플릿 사용 또는 Custom Token 생성
# 5. Account ID는 대시보드 우측 사이드바에서 확인

CLOUDFLARE_ACCOUNT_ID=832c21f2-d209-42b7-8bbc-8b2ed95c13dd
CLOUDFLARE_API_TOKEN=w2Z3q-Iv1KW6i3463JEvrGHjNgSJmj3e-t8aJQZF
CLOUDFLARE_D1_DATABASE_ID=832c21f2-d209-42b7-8bbc-8b2ed95c13dd

# R2 버킷 (이미 만들어놨다고 하셨죠?)
# R2 → 버킷 선택 → Settings → S3 API 에서 확인
# Access Key는 R2 → Manage R2 API Tokens에서 생성

CLOUDFLARE_R2_BUCKET_NAME=family-bucket
CLOUDFLARE_R2_ACCESS_KEY_ID=7d90165f2dfad45c78b81f2c73974773
CLOUDFLARE_R2_SECRET_ACCESS_KEY=48108bec12369a2d8febed49ca95a0659f15b0fbf71918c614a4ddfa43d4587d
CLOUDFLARE_R2_ENDPOINT=https://9f988c671c3dd6cdec6bcd8d6f70d328.r2.cloudflarestorage.com


# ============================================
# 🔐 BETTER AUTH (인증)
# ============================================
# 📍 발급처: 직접 생성 (외부 발급 필요 없음)
# 💰 무료: 오픈소스 라이브러리
#
# [생성 방법]
# 터미널에서 실행: openssl rand -base64 32
# 또는 https://generate-secret.vercel.app/32 에서 생성

BETTER_AUTH_SECRET=68183e347e039c2a5c055ebfdf69e47b
BETTER_AUTH_URL=http://localhost:3000


# ============================================
# 🔔 FIREBASE CLOUD MESSAGING (FCM 푸시 알림)
# ============================================
# 📍 발급처: https://console.firebase.google.com
# 💰 무료: FCM은 완전 무료 (무제한)
#
# [발급 방법]
# 1. Firebase Console → 프로젝트 생성 (또는 기존 프로젝트 선택)
# 2. 프로젝트 설정 (톱니바퀴) → 서비스 계정 탭
# 3. "새 비공개 키 생성" 클릭 → JSON 파일 다운로드
# 4. JSON 파일에서 아래 값들 복사:
#    - project_id → FIREBASE_PROJECT_ID
#    - private_key → FIREBASE_PRIVATE_KEY (따옴표 포함, \n 그대로)
#    - client_email → FIREBASE_CLIENT_EMAIL

FIREBASE_PROJECT_ID=family-base-4a4e3
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@family-base-4a4e3.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCu1XvbPZG4YpBU\nH+RqyqLIvEk2qbpxxv9gQWJYE4xiNYfx7/ESqt0YMMYj4PejZCghr+OVWjVlOBVZ\nvf8zvqv9rtfOXgT4iImzNf5e0ndZvvSAyr+xA3r1dZPVjk5TiAvQ0P5isWpQl8Ka\ngvpb8nNHryxTev5V19AmuTAYH5rFSEnNIn600ShHFJa2ho2x72pSIkkhPPEru4q8\nEx+q7zlrXML64DjBztTZwEmFjisGoQ58x7sOef/a07CJf39zDf81ekciSLRlJtFn\nRPQ2ODgnAQWIF/JBms4EUlnN9AXyrGH/MKuzXjVZNXINmZyYYlc+k3oP25/YSTtk\n4SXQwynvAgMBAAECggEAVoLit7i+m3uCKW5ii4lbhXLN05Om41fx1AJmlGiP5aTR\ncSEmq/MKVkcENIrEXwBXb1vmhGfP1hcrUW3XkxY9atkShlY1pXmCkcAc73S7hBge\nSoCI3CF5vW4BygGRtnmyRxCzX8ikb964d9Zp5geRjZ4bk+9fXMDeidrG9pjk78sl\nALPFMOR/+Ww+6Ejt8sSdPEUKuaDb1+7+NJaVFRax949NXhGAQjFapYZCEjtOn5wj\nBwNrRdgWIzUl1zmnTLyGCRjAkL0lwrnvjUB6U2ue0DjgOEzRp/D8d+m4CQ+mUbgI\n2ltuGoya6BtcIobBr2BRTvzTzM6UKoxsP1JR3b1GcQKBgQDVaBBQiRyiEIhiYefb\nfvaHOD5tW2ZwbjPTn2xOerAR8sBEGFtMFGvVcPrMmaA3Cjfnfgl4sck0RyOLFqfw\nIxEpIdfI/NAOUi+1Lh/JzYvQun+8tVpESb9cc5f2Azi5PPMHeiS6oVjiGuJ3zCR/\nPopSkdIVh8VHXSD+KDsrOJCxyQKBgQDRupEQbZuur+UlOY1VwL05E9M9xgvjLqmq\nwMHde3bOwSQMB5de4HMCIjrakPZGUJ6nao7oYdvDaXnHXOqAbcoeNW5s7OFYW2OG\nzQjIFHV5eqNWH50yBhPSDnsQLboczh097IdxO329PaCZWQfDUSDuaS4m/9rIyljK\nOpFVivMZ9wKBgBa9Etfx9BoUluOcuP67RXtc89HlJkIei+klmH24NuCCtBfNXJT7\nrA2/DwoT6G1U6mYBGPNCRkUKu2/LhzNgGSj/0SU6QtTzzt+IPZzcCOTBqnCqBic2\nkGxCaNOuvjGGnAKU8irsnDLjWHQZTV49hLGNlgvzPoL/Gk/aa4uMaGZ5AoGAGEhl\nq2VFdUBgY6L6PkeGoSkueCSKE8+/TUnsKFy3MNEj/1CRsiaCqmiUL+JA4XtMI04v\nJbDO5R09QFv9usj7cev10R7MKJLMPztWHPRhdaNBbiNS7AvQF64diY4B0nv63sSY\nGgAtWs/b3GV2hKLMEU6UTWeqST1EcoW9dg4Uf5kCgYEAhkYo3X/ogyyE6K1Jk4Wj\nNUICEm7fNyrZXSI9NN8tUMGLd5MJ9EV1CIBZfLiEFG7dYBmxRafWGskl5nhIu0Kl\nRWEk76krHb46MfrA2UuKB7UcYOH/lMyabKlyIJdmYfPWId/1hnlJF9ZgsbPMYyC+\n8zTGvsgMl0dHR0e/hiRcm2g=\n-----END PRIVATE KEY-----\n"


# ============================================
# 🌤️ 기상청 날씨 API (공공데이터포털)
# ============================================
# 📍 발급처: https://www.data.go.kr
# 💰 무료: 일 10,000회 호출 (충분함)
#
# [발급 방법]
# 1. 공공데이터포털 회원가입/로그인
# 2. 검색: "기상청_단기예보 ((구)_동네예보) 조회서비스"
# 3. 활용신청 버튼 클릭 → 신청서 작성 (자동 승인)
# 4. 마이페이지 → 데이터활용 → 승인된 API → 일반 인증키(Decoding) 복사
#
# ⚠️ 인코딩 키 말고 "일반 인증키(Decoding)" 사용!

WEATHER_API_KEY=


# ============================================
# 📈 증시 API (Alpha Vantage)
# ============================================
# 📍 발급처: https://www.alphavantage.co/support/#api-key
# 💰 무료: 일 25회, 분당 5회 (개인용 충분)
#
# [발급 방법]
# 1. 위 링크 접속
# 2. 이메일, 이름 입력 후 "GET FREE API KEY" 클릭
# 3. 이메일로 API Key 수신 (즉시 발급)
#
# 💡 대안: Finnhub (https://finnhub.io) - 무료 60회/분

STOCK_API_KEY=N18DZWGSUGXB2EJ5


# ============================================
# 🗺️ 네이버 지도 API
# ============================================
# 📍 발급처: https://www.ncloud.com/product/applicationService/maps
# 💰 무료: 월 3만원 크레딧 (신규), 이후 일부 무료 할당량
#
# [발급 방법]
# 1. 네이버 클라우드 플랫폼 가입 (https://www.ncloud.com)
# 2. 콘솔 → Services → AI·Application Service → Maps
# 3. Application 등록 → 앱 이름 입력
# 4. Web Dynamic Map, Geocoding, Reverse Geocoding, Search 활성화
# 5. 등록 후 Client ID, Client Secret 확인
#
# ⚠️ 모바일 앱용으로 Android 패키지명도 등록 필요:
#    - Android: com.yourcompany.lifesync (capacitor.config.ts와 일치)

NAVER_MAP_CLIENT_ID=jlk3off23q
NAVER_MAP_CLIENT_SECRET=24ylUKdhn58XDwD0Fquv5FYvScas2MPzUjuk01o2


# ============================================
# 🌐 APP 설정
# ============================================
# 개발 중에는 localhost, 배포 후 실제 도메인으로 변경

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📊 API별 무료 한도 요약

| 서비스 | 무료 한도 | 충분한가? |
|--------|----------|----------|
| **Cloudflare D1** | 5GB 저장, 일 5백만 읽기 | ✅ 충분 |
| **Cloudflare R2** | 10GB 저장, 월 1천만 요청 | ✅ 충분 |
| **Firebase FCM** | 무제한 | ✅ 완전 무료 |
| **기상청 API** | 일 10,000회 | ✅ 충분 |
| **Alpha Vantage** | 일 25회, 분당 5회 | ⚠️ 캐싱 필요 |
| **네이버 지도** | 월 3만원 크레딧 (신규) | ✅ 초기 충분 |

---

## ⚠️ 주의사항

### Alpha Vantage 제한 대응
일 25회는 좀 적을 수 있어요. 대응 방법:
```typescript
// 1. 서버사이드 캐싱 (1시간마다 갱신)
// 2. 장 마감 후에는 API 호출 안 함
// 3. 대안: Finnhub (무료 60회/분) 또는 한국투자증권 API (무료)
```

### 네이버 지도 크레딧 소진 후
신규 가입 시 3만원 크레딧이 있지만 소진 후:
- Web Dynamic Map: 월 10만회 무료
- Geocoding: 월 1만회 무료
- 개인 프로젝트면 충분!

### 기상청 API 인코딩 주의
```
❌ 인코딩 키 (Encoding) - URL에서 깨짐
✅ 일반 인증키 (Decoding) - 이거 사용!
```

---

## 🚀 발급 순서 추천

1. **Cloudflare** - 이미 D1/R2 만들어놨으니 API Token만 생성
2. **Better Auth Secret** - 터미널에서 바로 생성 가능
3. **기상청 API** - 자동 승인이라 빠름
4. **Alpha Vantage** - 이메일 입력하면 즉시 발급
5. **Firebase** - 프로젝트 생성 + 서비스 계정 키
6. **네이버 지도** - 마지막 (설정이 좀 복잡)

---

## 📝 Cursor에게 전달할 때

```
.env.local 파일에 아래 API 키들을 설정했습니다:
- Cloudflare D1/R2: ✅ 완료
- Better Auth: ✅ 완료
- Firebase FCM: ✅ 완료
- 기상청 API: ✅ 완료
- Alpha Vantage: ✅ 완료
- 네이버 지도: ✅ 완료

PRD 문서를 참고해서 Phase 1부터 시작해주세요.
```

---

## 💡 선택적 API (나중에 필요하면)

| 서비스 | 용도 | 무료 여부 |
|--------|------|----------|
| **한국투자증권 API** | 국내 증시 실시간 | ✅ 무료 |
| **Finnhub** | 해외 증시 | ✅ 60회/분 무료 |
| **Cloudflare Stream** | 영상 스트리밍 | ❌ 유료 |
| **Sentry** | 에러 트래킹 | ✅ 월 5천 이벤트 무료 |

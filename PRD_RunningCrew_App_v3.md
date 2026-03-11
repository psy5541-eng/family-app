# 🏃 RunningCrew App - Product Requirements Document (PRD)

> **Garmin 연동 러닝 크루 앱 with 싸이월드 감성 게이미피케이션**  
> 작성일: 2026-03-11  
> 버전: 3.0

---

## 🎯 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **앱 이름** | RunningCrew (가칭) |
| **목적** | Garmin 데이터 기반 러닝 크루 소셜 앱 + 게이미피케이션 |
| **타겟** | 10명 이하 소규모 러닝 크루 |
| **플랫폼** | Android / iOS (Capacitor) |
| **핵심 컨셉** | 싸이월드 미니미 감성 + 도토리(포인트) 상점 |
| **상용화** | ❌ 비상용 (무료 에셋만 사용) |

---

## 📱 메뉴 구조

```
┌─────────────────────────────────────┐
│           RunningCrew               │
├─────────────────────────────────────┤
│         [메인 콘텐츠 영역]           │
├─────────────────────────────────────┤
│  🏠    📋    🛒    📸    📅    ⚙️   │
│ 대시  운동  상점  피드  일정  설정   │
└─────────────────────────────────────┘
```

| 메뉴 | 설명 |
|------|------|
| 🏠 대시보드 | 마일리지 트랙 + 고도 산악 위젯 |
| 📋 운동목록 | 전체 멤버 운동 기록 (공개/비공개) |
| 🛒 상점 | 포인트로 도트 아이템 구매 |
| 📸 피드 | 러닝 기록 공유 |
| 📅 일정 | 러닝 모임 일정 |
| ⚙️ 설정 | 내 정보 + 캐릭터 꾸미기 |

---

## 🏁 1. 대시보드 (Dashboard)

### 1.1 전체 레이아웃

```
┌─────────────────────────────────────────┐
│  🏁 2026년 3월 크루 레이스              │
├─────────────────────────────────────────┤
│                                         │
│  🥇 김철수 245km  🥈 이영희 198km  🥉 나 156km │
│                                         │
├─────────────────────────────────────────┤
│  📏 마일리지 트랙                [월간▼]│
│  ┌─────────────────────────────────┐   │
│  │  🏃🏃🏃🏃🏃 ─────────────── 🏁  │   │
│  │  (트랙 배경 + 1~5등 캐릭터)      │   │
│  │                                  │   │
│  │  6. 박지민 78km                  │   │
│  │  7. 최수현 65km                  │   │
│  │  8. 정민우 42km                  │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  ⛰️ 고도 챌린지                  [월간▼]│
│  ┌─────────────────────────────────┐   │
│  │        🏔️                       │   │
│  │      ⛰️  🏃                     │   │
│  │    ⛰️    🏃🏃                   │   │
│  │  🌲🌲  🏃🏃🏃                   │   │
│  │  (산 배경 + 1~5등 캐릭터)        │   │
│  │                                  │   │
│  │  6. 정민우 +320m                 │   │
│  │  7. 최수현 +280m                 │   │
│  │  8. 박지민 +150m                 │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 1.2 상단 TOP 3 영역

```typescript
type Top3Props = {
  period: 'monthly' | 'yearly';
  rankings: {
    rank: 1 | 2 | 3;
    userId: string;
    nickname: string;
    totalDistance: number;  // km
  }[];
};
```

**UI 구성:**
- 🥇🥈🥉 메달 아이콘 + 닉네임 + 마일리지
- 가로 정렬, 1등 중앙 강조
- 터치 시 상세 정보 팝업

### 1.3 마일리지 트랙 위젯

```typescript
type MileageTrackProps = {
  period: 'monthly' | 'yearly';
  members: TrackMember[];
  maxDistance: number;  // 트랙 최대 거리 (동적 계산)
};

type TrackMember = {
  userId: string;
  nickname: string;
  character: CharacterConfig;  // 도트 캐릭터 설정
  totalDistance: number;
  rank: number;
  isMe: boolean;
};
```

**표시 규칙:**

| 순위 | 표시 방식 |
|------|----------|
| 1~5등 | 🏃 도트 캐릭터 (뛰는 애니메이션) + 위치 |
| 6등~ | 텍스트만 (순위. 닉네임 거리km) |

**위치 계산:**
```typescript
// X축 위치 = (내 마일리지 / 1등 마일리지) * 트랙 너비
const xPosition = (member.totalDistance / maxDistance) * 100;
```

**배경:**
- 육상 트랙 스타일 (레인, 출발선, 결승선)
- 도트/픽셀아트 느낌

### 1.4 고도 챌린지 위젯

```typescript
type ElevationWidgetProps = {
  period: 'monthly' | 'yearly';
  members: ElevationMember[];
  maxElevation: number;  // 최대 고도 (동적 계산)
};

type ElevationMember = {
  userId: string;
  nickname: string;
  character: CharacterConfig;
  totalElevation: number;  // 누적 상승 고도 (m)
  rank: number;
  isMe: boolean;
};
```

**표시 규칙:**

| 순위 | 표시 방식 |
|------|----------|
| 1~5등 | 🏃 도트 캐릭터 (등산 애니메이션) + 높이 위치 |
| 6등~ | 텍스트만 (순위. 닉네임 +고도m) |

**위치 계산:**
```typescript
// Y축 위치 = (내 고도 / 1등 고도) * 산 높이
const yPosition = (member.totalElevation / maxElevation) * 100;
```

**배경:**
- 산악 풍경 (도트 스타일)
- 하단: 나무, 풀밭
- 중단: 바위, 능선
- 상단: 정상, 깃발

### 1.5 캐릭터 터치 → 상세 팝업

```typescript
type MemberDetailPopup = {
  userId: string;
  nickname: string;
  profileImage?: string;
  character: CharacterConfig;
  
  // 통계
  stats: {
    // 월간
    monthlyDistance: number;
    monthlyElevation: number;
    monthlyTime: number;        // 분
    monthlyActivityCount: number;
    
    // 연간
    yearlyDistance: number;
    yearlyElevation: number;
    yearlyTime: number;
    yearlyActivityCount: number;
  };
  
  // 순위
  ranks: {
    monthlyDistanceRank: number;
    monthlyElevationRank: number;
    yearlyDistanceRank: number;
    yearlyElevationRank: number;
  };
};
```

**팝업 UI:**
```
┌─────────────────────────────────────┐
│  ╳                                  │
│         🏃 [도트 캐릭터]            │
│           김철수                    │
├─────────────────────────────────────┤
│  📅 3월 기록                        │
│  ─────────────────────────────────  │
│  📏 245.3 km        ⛰️ +2,840 m    │
│  ⏱️ 24시간 32분     🏃 18회        │
├─────────────────────────────────────┤
│  📅 2026년 누적                     │
│  ─────────────────────────────────  │
│  📏 892.1 km        ⛰️ +8,420 m    │
│  ⏱️ 89시간 15분     🏃 62회        │
├─────────────────────────────────────┤
│  🏆 순위                            │
│  마일리지 월 1위 / 년 2위           │
│  고도 월 3위 / 년 4위               │
└─────────────────────────────────────┘
```

---

## 📋 2. 운동 목록 (Activities)

### 2.1 화면 구성

```
┌─────────────────────────────────────┐
│  📋 크루 운동 기록           [필터▼]│
├─────────────────────────────────────┤
│  [전체] [러닝] [트레일] [걷기]       │
├─────────────────────────────────────┤
│  ─── 오늘 ───                       │
│  ┌─────────────────────────────┐   │
│  │ 👤 김철수              08:32 │   │
│  │ 🏃 모닝런                    │   │
│  │ 5.23km  28:34  5'28"/km     │   │
│  │ ❤️ 156bpm  🔥 412kcal       │   │
│  │                    +52 P 💰 │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 나                  07:15 │   │
│  │ 🏃 출근런                    │   │
│  │ 3.8km  22:10  5'50"/km      │   │
│  │ 🔒 비공개                    │ ← 비공개 표시
│  └─────────────────────────────┘   │
│                                     │
│  ─── 어제 ───                       │
│  ┌─────────────────────────────┐   │
│  │ 👤 이영희              18:45 │   │
│  │ 🥾 트레일런                  │   │
│  │ 12.8km  1:42:15  7'59"/km   │   │
│  │ ⛰️ +342m  🔥 856kcal        │   │
│  │                   +180 P 💰 │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 2.2 데이터 구조

```typescript
type Activity = {
  id: string;
  userId: string;
  nickname: string;
  
  // 운동 정보
  type: 'running' | 'trail_running' | 'walking';
  title: string;
  date: Date;
  
  // 기록
  distance: number;      // km
  duration: number;      // 초
  pace: number;          // 초/km
  calories: number;
  heartRate?: number;    // 평균 bpm
  elevation?: number;    // 누적 상승 고도
  
  // 포인트
  pointsEarned: number;
  
  // 공개 설정
  visibility: 'public' | 'private';
};
```

### 2.3 공개/비공개 기능

**비공개 시 다른 멤버에게 보이는 정보:**
```
👤 나  07:15
🔒 비공개 운동 기록
```

**본인에게 보이는 정보:**
- 전체 정보 + 🔒 아이콘
- 터치하면 공개/비공개 토글

**설정 위치:**
- 운동 상세 화면에서 개별 설정
- 설정 > 기본 공개 설정 (신규 운동 기본값)

---

## 👾 3. 캐릭터 시스템 (도트/픽셀아트)

### 3.1 컨셉

**싸이월드 미니미 감성:**
- 도트(픽셀아트) 그래픽
- 페이퍼돌 레이어 방식 (옷 겹쳐입기)
- 스프라이트 시트 애니메이션

### 3.2 캐릭터 구조

```typescript
type CharacterConfig = {
  base: 'male' | 'female';        // 기본 몸
  skinTone: string;               // 피부톤
  
  // 장착 아이템 (레이어)
  equippedHat?: string;           // 모자
  equippedTop?: string;           // 상의
  equippedBottom?: string;        // 하의
  equippedShoes?: string;         // 신발
  equippedEffect?: string;        // 효과
  
  // 이름표
  nameplate: {
    text: string;
    frameStyle: string;
    effectStyle?: string;
  };
};
```

### 3.3 레이어 순서 (z-index)

```
z-50: 효과 (반짝임, 후광)
z-40: 모자
z-30: 상의
z-20: 하의
z-15: 신발
z-10: 기본 몸 (base)
z-0:  그림자
```

### 3.4 에셋 폴더 구조

```
/public/assets/minimi/
├── base/
│   ├── male-run.png          (32x32 * 4프레임)
│   ├── male-climb.png        (32x32 * 4프레임)
│   ├── female-run.png
│   └── female-climb.png
├── hat/
│   ├── cap-red.png
│   ├── cap-blue.png
│   ├── beanie-black.png
│   └── visor-white.png
├── top/
│   ├── tshirt-white.png
│   ├── tshirt-black.png
│   ├── tanktop-red.png
│   └── jacket-blue.png
├── bottom/
│   ├── shorts-black.png
│   ├── shorts-red.png
│   └── leggings-gray.png
├── shoes/
│   ├── running-white.png
│   └── trail-brown.png
├── effect/
│   ├── sparkle.png
│   ├── flame.png
│   └── halo.png
└── nameplate/
    ├── frame-basic.png
    ├── frame-gold.png
    └── frame-rainbow.png
```

### 3.5 스프라이트 애니메이션

**스프라이트 시트 규격:**
- 캐릭터 크기: 32x32 픽셀
- 프레임 수: 4프레임 (달리기/등산)
- 시트 크기: 128x32 픽셀

**CSS 애니메이션:**
```css
/* 달리기 애니메이션 */
@keyframes pixel-run {
  from { background-position: 0 0; }
  to { background-position: -128px 0; }
}

.minimi-running {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
  animation: pixel-run 0.4s steps(4) infinite;
}

/* 등산 애니메이션 */
@keyframes pixel-climb {
  from { background-position: 0 0; }
  to { background-position: -128px 0; }
}

.minimi-climbing {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
  animation: pixel-climb 0.6s steps(4) infinite;
}
```

### 3.6 React 컴포넌트

```tsx
type MinimCharacterProps = {
  config: CharacterConfig;
  animation: 'idle' | 'run' | 'climb';
  size: 'sm' | 'md' | 'lg';  // 32px, 64px, 128px
  isMe?: boolean;
};

const MinimiCharacter: React.FC<MinimCharacterProps> = ({
  config,
  animation,
  size,
  isMe
}) => {
  const sizeMap = { sm: 32, md: 64, lg: 128 };
  const px = sizeMap[size];
  
  return (
    <div className={`relative ${isMe ? 'ring-2 ring-yellow-400' : ''}`}>
      {/* 기본 몸 */}
      <div 
        className={`absolute minimi-${animation}`}
        style={{
          width: px,
          height: px,
          backgroundImage: `url(/assets/minimi/base/${config.base}-${animation}.png)`,
          imageRendering: 'pixelated',
          zIndex: 10
        }}
      />
      
      {/* 신발 레이어 */}
      {config.equippedShoes && (
        <img 
          src={`/assets/minimi/shoes/${config.equippedShoes}.png`}
          className="absolute"
          style={{ width: px, height: px, imageRendering: 'pixelated', zIndex: 15 }}
        />
      )}
      
      {/* 하의 레이어 */}
      {config.equippedBottom && (
        <img 
          src={`/assets/minimi/bottom/${config.equippedBottom}.png`}
          className="absolute"
          style={{ width: px, height: px, imageRendering: 'pixelated', zIndex: 20 }}
        />
      )}
      
      {/* 상의 레이어 */}
      {config.equippedTop && (
        <img 
          src={`/assets/minimi/top/${config.equippedTop}.png`}
          className="absolute"
          style={{ width: px, height: px, imageRendering: 'pixelated', zIndex: 30 }}
        />
      )}
      
      {/* 모자 레이어 */}
      {config.equippedHat && (
        <img 
          src={`/assets/minimi/hat/${config.equippedHat}.png`}
          className="absolute"
          style={{ width: px, height: px, imageRendering: 'pixelated', zIndex: 40 }}
        />
      )}
      
      {/* 효과 레이어 */}
      {config.equippedEffect && (
        <img 
          src={`/assets/minimi/effect/${config.equippedEffect}.png`}
          className="absolute animate-pulse"
          style={{ width: px, height: px, imageRendering: 'pixelated', zIndex: 50 }}
        />
      )}
    </div>
  );
};
```

---

## 🛒 4. 상점 (Shop)

### 4.1 화면 구성

```
┌─────────────────────────────────────┐
│  🛒 상점               💰 2,450 P  │
├─────────────────────────────────────┤
│  [모자] [상의] [하의] [신발] [효과]  │
├─────────────────────────────────────┤
│                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│  │ 🧢 │ │ 🎩 │ │ 👒 │ │ 🪖 │      │
│  │    │ │    │ │    │ │    │      │
│  │500P│ │800P│ │600P│ │1.2K│      │
│  │[구매]│ │[구매]│ │ ✓ │ │[구매]│   │
│  └────┘ └────┘ └────┘ └────┘      │
│                                     │
│  💡 러닝하면 포인트가 쌓여요!        │
└─────────────────────────────────────┘
```

### 4.2 아이템 데이터

```typescript
type ShopItem = {
  id: string;
  category: 'hat' | 'top' | 'bottom' | 'shoes' | 'effect';
  name: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic';
  previewImage: string;
  assetFileName: string;
};
```

### 4.3 가격표

| 카테고리 | Common | Rare | Epic |
|----------|--------|------|------|
| 🧢 모자 | 300~500P | 800~1200P | 1500~2000P |
| 👕 상의 | 300~500P | 700~1000P | 1500~2000P |
| 👖 하의 | 300~500P | 700~1000P | 1200~1500P |
| 👟 신발 | 500~700P | 1000~1500P | 2000~2500P |
| ✨ 효과 | 200~400P | 600~1000P | 1500~2000P |

---

## ⚙️ 5. 설정 (Settings)

### 5.1 메뉴 구조

```
┌─────────────────────────────────────┐
│  ⚙️ 설정                            │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │  🏃 [내 캐릭터 미리보기]      │   │
│  │     홍길동 · Lv.12 러너      │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  📊 내 통계                    →   │
│  🎨 캐릭터 꾸미기               →   │
│  🔗 Garmin 연결                →   │
├─────────────────────────────────────┤
│  👤 프로필 설정                →   │
│  🔔 알림 설정                  →   │
│  🔒 기본 공개 설정             →   │
│  🌙 다크모드                   ○   │
│  📱 앱 정보                    →   │
└─────────────────────────────────────┘
```

### 5.2 기본 공개 설정

```
┌─────────────────────────────────────┐
│  ← 🔒 기본 공개 설정                │
├─────────────────────────────────────┤
│                                     │
│  신규 운동 기록 기본값              │
│  ┌─────────────────────────────┐   │
│  │  ○ 공개 (크루 전체 공개)     │   │
│  │  ● 비공개 (나만 보기)        │   │
│  └─────────────────────────────┘   │
│                                     │
│  💡 개별 운동 기록에서 변경 가능    │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔗 6. Garmin 연동

### 6.1 연동 방식 (2단계 전략)

| 우선순위 | 방식 | 설명 |
|----------|------|------|
| **1차** | garmin-connect (비공식) | 10명 이하 소규모 크루용 |
| **2차** | Health Connect + HealthKit | 1차 막히면 전환 |

### 6.2 비공식 라이브러리 사용

```typescript
// garmin-connect npm 패키지
import { GarminConnect } from 'garmin-connect';

const client = new GarminConnect({
  username: userEmail,
  password: userPassword  // 암호화 저장
});

// 로그인
await client.login();

// 활동 목록 가져오기
const activities = await client.getActivities(0, 10);

// 활동 상세 정보
const detail = await client.getActivity(activityId);
```

### 6.3 동기화 주기

```
- 앱 실행 시 자동 동기화
- 수동 새로고침 (Pull to Refresh)
- 백그라운드: 1일 1회 (FCM 트리거)
```

### 6.4 백업 플랜 (Health Connect / HealthKit)

```typescript
// Android: Health Connect
import { HealthConnect } from '@anthropic/capacitor-health-connect';

// iOS: HealthKit  
import { HealthKit } from '@anthropic/capacitor-healthkit';

// 공통 인터페이스
interface HealthDataProvider {
  requestPermissions(): Promise<boolean>;
  getWorkouts(startDate: Date, endDate: Date): Promise<Workout[]>;
}
```

---

## 🗄️ 7. 데이터베이스 스키마

```typescript
// ==================== 사용자 ====================
users: {
  id,
  email,
  nickname,
  profileImage,
  createdAt
}

// ==================== GARMIN 연동 ====================
garminAccounts: {
  id,
  userId,
  garminEmail,
  encryptedPassword,  // AES-256 암호화
  lastSyncAt
}

// ==================== 활동 기록 ====================
activities: {
  id,
  oderId,
  garminActivityId,
  
  // 운동 정보
  activityType,
  title,
  startTime,
  
  // 기록
  duration,
  distance,
  pace,
  heartRate,
  calories,
  elevation,
  
  // 포인트
  pointsEarned,
  
  // 공개 설정
  visibility: 'public' | 'private'
}

// ==================== 포인트 ====================
userPoints: {
  id,
  userId,
  currentPoints,
  totalEarned,
  totalSpent
}

pointTransactions: {
  id,
  userId,
  amount,
  type: 'earn' | 'spend',
  referenceId,
  description,
  createdAt
}

// ==================== 상점 ====================
shopItems: {
  id,
  category,
  name,
  price,
  rarity,
  previewImage,
  assetFileName
}

userInventory: {
  id,
  userId,
  itemId,
  purchasedAt
}

// ==================== 캐릭터 ====================
userCharacters: {
  id,
  userId,
  base,
  skinTone,
  equippedHat,
  equippedTop,
  equippedBottom,
  equippedShoes,
  equippedEffect,
  nameplateText,
  nameplateFrame,
  nameplateEffect
}

// ==================== 랭킹 (캐시) ====================
rankings: {
  id,
  period: 'monthly' | 'yearly',
  periodKey,  // '2026-03' or '2026'
  userId,
  
  // 마일리지
  totalDistance,
  distanceRank,
  
  // 고도
  totalElevation,
  elevationRank,
  
  // 기타
  totalTime,
  activityCount,
  
  updatedAt
}
```

---

## 🎨 8. 무료 에셋 소스

### 8.1 도트 캐릭터 에셋

| 소스 | URL | 추천 검색어 |
|------|-----|------------|
| **itch.io** | https://itch.io/game-assets/free | `Pixel art character base`, `Paperdoll pixel art` |
| **OpenGameArt** | https://opengameart.org | `LPC character`, `Pixel paperdoll` |

### 8.2 배경 에셋

| 소스 | URL | 라이선스 |
|------|-----|----------|
| **Kenney** | https://kenney.nl | CC0 (완전 무료) |
| **OpenGameArt** | https://opengameart.org | CC0 / CC-BY |

### 8.3 아이콘

| 소스 | URL | 라이선스 |
|------|-----|----------|
| **Lucide** | https://lucide.dev | ISC |
| **Heroicons** | https://heroicons.com | MIT |

---

## 📱 9. 기술 스택

### 9.1 기존 재사용 (LifeSync)

| 카테고리 | 기술 |
|---------|------|
| Framework | Next.js 14+ (App Router) |
| Mobile | Capacitor 6+ |
| Styling | Tailwind CSS 3.4+ |
| DB | Cloudflare D1 + Drizzle ORM |
| Storage | Cloudflare R2 |
| Auth | Better Auth |
| Push | Firebase Cloud Messaging |

### 9.2 신규 추가

| 카테고리 | 기술 | 용도 |
|---------|------|------|
| Garmin | garmin-connect (비공식) | 운동 데이터 동기화 |
| 백업 | Health Connect / HealthKit | Garmin 막히면 대체 |
| 캐릭터 | CSS Sprite Animation | 도트 애니메이션 |
| 암호화 | crypto-js | Garmin 비밀번호 암호화 |

---

## 📋 10. 개발 Phase

| Phase | 내용 | 기간 |
|-------|------|------|
| 1 | 프로젝트 설정 (LifeSync 복사) | 1일 |
| 2 | Garmin 연동 (비공식 라이브러리) | 2-3일 |
| 3 | 운동 목록 + 공개/비공개 기능 | 2일 |
| 4 | 포인트 시스템 | 1일 |
| 5 | 도트 캐릭터 시스템 | 2-3일 |
| 6 | 대시보드 (트랙 + 고도 위젯) | 3일 |
| 7 | 상점 + 인벤토리 | 2일 |
| 8 | 설정 + 캐릭터 꾸미기 | 1일 |
| 9 | 피드/일정 (재사용) | 1일 |
| 10 | 테스트 + 버그 수정 | 2일 |
| **총합** | | **17-19일** |

---

## 💰 11. 비용

| 항목 | 비용 |
|------|------|
| Cloudflare (D1, R2, Pages) | $0 |
| Firebase FCM | $0 |
| Garmin 비공식 라이브러리 | $0 |
| 도트 에셋 (무료) | $0 |
| **총합** | **$0** |

---

## ✅ 12. 요약

| 항목 | 내용 |
|------|------|
| **대시보드** | TOP3 + 마일리지 트랙 + 고도 산악 위젯 |
| **캐릭터** | 싸이월드 미니미 감성 도트 그래픽 |
| **운동목록** | 전체 멤버 + 공개/비공개 선택 |
| **연동** | Garmin 비공식 (백업: Health Connect/HealthKit) |
| **에셋** | 100% 무료 (itch.io, OpenGameArt, Kenney) |
| **비용** | $0 |
| **개발 기간** | 17-19일 |

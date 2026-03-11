# 🏃 RunningCrew App - Product Requirements Document (PRD)

> **Garmin 연동 러닝 크루 앱 with 싸이월드 감성 게이미피케이션**  
> 작성일: 2026-03-11  
> 버전: 4.0

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
| 🛒 상점 | 포인트로 도트 아이템 + 텍스트 효과 구매 |
| 📸 피드 | 러닝 기록 공유 |
| 📅 일정 | 러닝 모임 일정 |
| ⚙️ 설정 | 내 정보 + 캐릭터 꾸미기 + 관리자 |

---

## 🏁 1. 대시보드 (Dashboard)

### 1.1 전체 레이아웃

```
┌─────────────────────────────────────────┐
│  🏁 2026년 3월 크루 레이스              │
├─────────────────────────────────────────┤
│                                         │
│  🥇 ✨김철수✨ 245km                    │  ← 텍스트 효과 적용
│  🥈 이영희 198km                        │
│  🥉 🌈나🌈 156km                        │  ← 텍스트 효과 적용
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
    nicknameEffect?: TextEffect;  // 텍스트 효과
    totalDistance: number;
  }[];
};
```

**UI 구성:**
- 🥇🥈🥉 메달 아이콘 + 닉네임 (텍스트 효과 적용) + 마일리지
- 터치 시 상세 정보 팝업

### 1.3 마일리지 트랙 위젯

**표시 규칙:**

| 순위 | 표시 방식 |
|------|----------|
| 1~5등 | 🏃 도트 캐릭터 (뛰는 애니메이션) + 위치 |
| 6등~ | 텍스트만 (순위. 닉네임 거리km) |

### 1.4 고도 챌린지 위젯

**표시 규칙:**

| 순위 | 표시 방식 |
|------|----------|
| 1~5등 | 🏃 도트 캐릭터 (등산 애니메이션) + 높이 위치 |
| 6등~ | 텍스트만 (순위. 닉네임 +고도m) |

### 1.5 캐릭터 터치 → 상세 팝업

```
┌─────────────────────────────────────┐
│  ╳                                  │
│         🏃 [도트 캐릭터]            │
│         ✨김철수✨                  │  ← 텍스트 효과 적용
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

### 2.1 화면 구성 (필터탭 제거)

```
┌─────────────────────────────────────┐
│  📋 크루 운동 기록                  │
├─────────────────────────────────────┤
│  ─── 오늘 ───                       │
│  ┌─────────────────────────────┐   │
│  │ 👤 ✨김철수✨          08:32 │   │  ← 텍스트 효과
│  │ 🏃 러닝 · 모닝런             │   │  ← 유형 표시
│  │ 5.23km  28:34  5'28"/km     │   │
│  │ ❤️ 156bpm  🔥 412kcal       │   │
│  │                    +52 P 💰 │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 🌈나🌈              07:15 │   │  ← 텍스트 효과
│  │ 🏃 러닝 · 출근런             │   │
│  │ 🔒 비공개                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ─── 어제 ───                       │
│  ┌─────────────────────────────┐   │
│  │ 👤 이영희              18:45 │   │
│  │ 🥾 트레일 · 북한산 코스      │   │  ← 유형 표시
│  │ 12.8km  1:42:15  7'59"/km   │   │
│  │ ⛰️ +342m  🔥 856kcal        │   │
│  │                   +180 P 💰 │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 2.2 운동 유형 표시

| 유형 | 아이콘 | 표시 |
|------|--------|------|
| 러닝 | 🏃 | `🏃 러닝 · {제목}` |
| 트레일 | 🥾 | `🥾 트레일 · {제목}` |
| 걷기 | 🚶 | `🚶 걷기 · {제목}` |

### 2.3 공개/비공개 기능

**비공개 시 다른 멤버에게 보이는 정보:**
```
👤 🌈나🌈  07:15
🔒 비공개 운동 기록
```

---

## 👾 3. 캐릭터 & 텍스트 효과 시스템

### 3.1 컨셉

**싸이월드 미니미 감성:**
- 도트(픽셀아트) 캐릭터
- 페이퍼돌 레이어 방식
- **프로필 텍스트 효과** (반짝임, 무지개, 불꽃 등)

### 3.2 캐릭터 + 텍스트 효과 구조

```typescript
type CharacterConfig = {
  // 기본 캐릭터
  base: 'male' | 'female';
  skinTone: string;
  
  // 장착 아이템 (캐릭터 레이어)
  equippedHat?: string;
  equippedTop?: string;
  equippedBottom?: string;
  equippedShoes?: string;
  equippedCharEffect?: string;  // 캐릭터 효과 (후광, 반짝임)
  
  // 프로필 텍스트 효과 (이름에 적용)
  nicknameEffect?: TextEffect;
};

type TextEffect = {
  effectType: 'none' | 'sparkle' | 'rainbow' | 'flame' | 'glow' | 'neon' | 'gradient';
  effectColor?: string;        // 단색 효과용
  effectColors?: string[];     // 그라데이션/무지개용
};
```

### 3.3 레이어 순서 (z-index)

```
=== 캐릭터 레이어 ===
z-60: 캐릭터 효과 (후광, 반짝임)
z-50: 모자
z-40: 상의
z-30: 하의
z-20: 신발
z-10: 기본 몸 (base)
z-0:  그림자

=== 텍스트 레이어 (이름표) ===
z-100: 텍스트 효과 (반짝임, 무지개 등)
z-90:  닉네임 텍스트
z-80:  이름표 프레임
```

### 3.4 텍스트 효과 종류

| 효과 | 설명 | CSS |
|------|------|-----|
| ✨ 반짝임 | 글자가 반짝반짝 | `animation: sparkle` |
| 🌈 무지개 | 글자 색상 무지개 | `background: linear-gradient` + `animation` |
| 🔥 불꽃 | 글자 주변 불꽃 | `text-shadow` + `animation` |
| 💡 글로우 | 은은한 빛 | `text-shadow: 0 0 10px` |
| 💜 네온 | 네온사인 느낌 | `text-shadow` 다중 |
| 🎨 그라데이션 | 2색 그라데이션 | `background-clip: text` |

### 3.5 텍스트 효과 CSS

```css
/* ✨ 반짝임 */
@keyframes sparkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; text-shadow: 0 0 10px gold; }
}
.text-sparkle {
  animation: sparkle 1.5s ease-in-out infinite;
  color: gold;
}

/* 🌈 무지개 */
@keyframes rainbow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
.text-rainbow {
  background: linear-gradient(90deg, red, orange, yellow, green, blue, purple, red);
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: rainbow 3s linear infinite;
}

/* 🔥 불꽃 */
@keyframes flame {
  0%, 100% { text-shadow: 0 0 4px #ff0, 0 -5px 4px #ff3, 0 -10px 6px #f80, 0 -15px 8px #f00; }
  50% { text-shadow: 0 0 4px #ff0, 0 -8px 6px #ff3, 0 -15px 8px #f80, 0 -20px 10px #f00; }
}
.text-flame {
  color: #ffcc00;
  animation: flame 0.8s ease-in-out infinite;
}

/* 💡 글로우 */
.text-glow {
  color: #fff;
  text-shadow: 0 0 10px #0ff, 0 0 20px #0ff, 0 0 30px #0ff;
}

/* 💜 네온 */
.text-neon {
  color: #fff;
  text-shadow: 0 0 5px #fff, 0 0 10px #ff00de, 0 0 20px #ff00de, 0 0 40px #ff00de;
}

/* 🎨 그라데이션 */
.text-gradient {
  background: linear-gradient(45deg, #f093fb, #f5576c);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}
```

### 3.6 텍스트 효과 적용 위치

| 화면 | 적용 위치 |
|------|----------|
| 대시보드 | TOP3 닉네임, 캐릭터 이름표 |
| 운동목록 | 운동 카드 내 닉네임 |
| 피드 | 게시물 작성자 닉네임 |
| 댓글 | 댓글 작성자 닉네임 |
| 팝업 | 상세 정보 팝업 닉네임 |

### 3.7 닉네임 컴포넌트

```tsx
type NicknameProps = {
  nickname: string;
  effect?: TextEffect;
  size?: 'sm' | 'md' | 'lg';
};

const Nickname: React.FC<NicknameProps> = ({ nickname, effect, size = 'md' }) => {
  const sizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-bold'
  };
  
  const effectClass = effect ? `text-${effect.effectType}` : '';
  
  return (
    <span 
      className={`${sizeClass[size]} ${effectClass}`}
      style={effect?.effectColors ? {
        background: `linear-gradient(90deg, ${effect.effectColors.join(', ')})`,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent'
      } : undefined}
    >
      {nickname}
    </span>
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
│  [캐릭터] [텍스트효과]               │  ← 대분류 탭
├─────────────────────────────────────┤
│  === 캐릭터 탭 ===                  │
│  [모자] [상의] [하의] [신발] [효과]  │
│                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│  │ 🧢 │ │ 🎩 │ │ 👒 │ │ 🪖 │      │
│  │500P│ │800P│ │600P│ │1.2K│      │
│  └────┘ └────┘ └────┘ └────┘      │
├─────────────────────────────────────┤
│  === 텍스트효과 탭 ===              │
│  [반짝임] [무지개] [불꽃] [글로우]   │
│                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│  │ ✨ │ │ 🌈 │ │ 🔥 │ │ 💡 │      │
│  │300P│ │500P│ │700P│ │400P│      │
│  └────┘ └────┘ └────┘ └────┘      │
└─────────────────────────────────────┘
```

### 4.2 아이템 카테고리

**캐릭터 아이템:**
| 카테고리 | 설명 |
|----------|------|
| 🧢 모자 | 캡, 바이저, 비니 등 |
| 👕 상의 | 티셔츠, 탱크탑, 자켓 등 |
| 👖 하의 | 숏츠, 레깅스 등 |
| 👟 신발 | 러닝화, 트레일화 등 |
| ✨ 캐릭터효과 | 후광, 반짝임 등 |

**텍스트 효과:**
| 카테고리 | 설명 |
|----------|------|
| ✨ 반짝임 | 반짝반짝 효과 |
| 🌈 무지개 | 무지개 색상 |
| 🔥 불꽃 | 불꽃 효과 |
| 💡 글로우 | 은은한 빛 |
| 💜 네온 | 네온사인 |
| 🎨 그라데이션 | 2색 그라데이션 |

### 4.3 아이템 데이터

```typescript
type ShopItem = {
  id: string;
  category: 'hat' | 'top' | 'bottom' | 'shoes' | 'char_effect' | 'text_effect';
  name: string;
  price: number;           // 관리자가 설정 가능
  rarity: 'common' | 'rare' | 'epic';
  previewImage: string;
  assetFileName?: string;  // 캐릭터 아이템용
  effectType?: string;     // 텍스트 효과용
  effectColors?: string[]; // 텍스트 효과용
  isActive: boolean;       // 판매 활성화 여부
};
```

---

## 👑 5. 관리자 기능

### 5.1 관리자 권한

```typescript
type UserRole = 'member' | 'admin';

// 관리자만 접근 가능한 기능
type AdminFeatures = {
  // 포인트 설정
  pointSettings: PointSettings;
  
  // 상점 아이템 관리
  shopItemManagement: ShopItemManagement;
  
  // 크루 관리
  crewManagement: CrewManagement;
};
```

### 5.2 설정 메뉴 (관리자용)

```
┌─────────────────────────────────────┐
│  ⚙️ 설정                            │
├─────────────────────────────────────┤
│  ... (일반 설정) ...                │
├─────────────────────────────────────┤
│  👑 관리자 설정              [Admin]│
│  ─────────────────────────────────  │
│  💰 포인트 설정                →   │
│  🛒 상점 관리                  →   │
│  👥 크루원 관리                →   │
└─────────────────────────────────────┘
```

### 5.3 포인트 설정 화면

```
┌─────────────────────────────────────┐
│  ← 💰 포인트 설정            [저장] │
├─────────────────────────────────────┤
│                                     │
│  📏 거리 기반 포인트                │
│  ┌─────────────────────────────┐   │
│  │  1km 당          [10] P     │   │
│  └─────────────────────────────┘   │
│                                     │
│  🎯 보너스 포인트                   │
│  ┌─────────────────────────────┐   │
│  │  10km 달성       [+50] P    │   │
│  │  하프(21km)      [+200] P   │   │
│  │  풀(42km)        [+500] P   │   │
│  └─────────────────────────────┘   │
│                                     │
│  🥾 운동 유형 배율                  │
│  ┌─────────────────────────────┐   │
│  │  러닝            [1.0] 배   │   │
│  │  트레일런        [1.5] 배   │   │
│  │  걷기            [0.5] 배   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ⛰️ 고도 보너스                    │
│  ┌─────────────────────────────┐   │
│  │  100m 당         [+10] P    │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 5.4 포인트 설정 데이터

```typescript
type PointSettings = {
  // 거리 기반
  pointsPerKm: number;           // 기본: 10
  
  // 보너스
  bonus10km: number;             // 기본: 50
  bonusHalfMarathon: number;     // 기본: 200
  bonusFullMarathon: number;     // 기본: 500
  
  // 운동 유형 배율
  multiplierRunning: number;     // 기본: 1.0
  multiplierTrail: number;       // 기본: 1.5
  multiplierWalking: number;     // 기본: 0.5
  
  // 고도 보너스
  pointsPer100mElevation: number; // 기본: 10
};
```

### 5.5 상점 관리 화면

```
┌─────────────────────────────────────┐
│  ← 🛒 상점 관리             [+추가] │
├─────────────────────────────────────┤
│  [캐릭터] [텍스트효과]               │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🧢 빨간 캡                  │   │
│  │  가격: [500] P   [수정]     │   │
│  │  상태: ● 판매중  [비활성화]  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  ✨ 반짝임 효과              │   │
│  │  가격: [300] P   [수정]     │   │
│  │  상태: ● 판매중  [비활성화]  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🌈 무지개 효과              │   │
│  │  가격: [500] P   [수정]     │   │
│  │  상태: ○ 비활성  [활성화]   │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 5.6 상점 아이템 수정 팝업

```
┌─────────────────────────────────────┐
│  아이템 수정                   [✕]  │
├─────────────────────────────────────┤
│                                     │
│  이름: [빨간 캡               ]     │
│                                     │
│  가격: [500      ] P                │
│                                     │
│  희귀도: [Common ▼]                 │
│          Common / Rare / Epic       │
│                                     │
│  판매 상태: ● 활성 ○ 비활성        │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │  취소   │  │  저장   │          │
│  └─────────┘  └─────────┘          │
└─────────────────────────────────────┘
```

### 5.7 포인트 계산 로직

```typescript
function calculatePoints(activity: Activity, settings: PointSettings): number {
  let points = 0;
  
  // 1. 거리 기반 포인트
  points += activity.distance * settings.pointsPerKm;
  
  // 2. 운동 유형 배율 적용
  const multiplier = {
    'running': settings.multiplierRunning,
    'trail_running': settings.multiplierTrail,
    'walking': settings.multiplierWalking
  }[activity.type];
  points *= multiplier;
  
  // 3. 거리 보너스
  if (activity.distance >= 42) {
    points += settings.bonusFullMarathon;
  } else if (activity.distance >= 21) {
    points += settings.bonusHalfMarathon;
  } else if (activity.distance >= 10) {
    points += settings.bonus10km;
  }
  
  // 4. 고도 보너스
  if (activity.elevation) {
    points += Math.floor(activity.elevation / 100) * settings.pointsPer100mElevation;
  }
  
  return Math.floor(points);
}
```

---

## 🗄️ 6. 데이터베이스 스키마

```typescript
// ==================== 사용자 ====================
users: {
  id,
  email,
  nickname,
  profileImage,
  role: 'member' | 'admin',  // 관리자 권한
  createdAt
}

// ==================== GARMIN 연동 ====================
garminAccounts: {
  id,
  userId,
  garminEmail,
  encryptedPassword,
  lastSyncAt
}

// ==================== 활동 기록 ====================
activities: {
  id,
  userId,
  garminActivityId,
  activityType,
  title,
  startTime,
  duration,
  distance,
  pace,
  heartRate,
  calories,
  elevation,
  pointsEarned,
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

// ==================== 포인트 설정 (관리자) ====================
pointSettings: {
  id,
  crewId,
  pointsPerKm,
  bonus10km,
  bonusHalfMarathon,
  bonusFullMarathon,
  multiplierRunning,
  multiplierTrail,
  multiplierWalking,
  pointsPer100mElevation,
  updatedAt,
  updatedBy  // 관리자 userId
}

// ==================== 상점 ====================
shopItems: {
  id,
  category,
  name,
  price,
  rarity,
  previewImage,
  assetFileName,
  effectType,
  effectColors,
  isActive,        // 판매 활성화 여부
  createdAt,
  updatedAt
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
  oderId,
  
  // 캐릭터 기본
  base,
  skinTone,
  
  // 캐릭터 아이템
  equippedHat,
  equippedTop,
  equippedBottom,
  equippedShoes,
  equippedCharEffect,
  
  // 텍스트 효과
  nicknameEffectType,
  nicknameEffectColors
}

// ==================== 랭킹 (캐시) ====================
rankings: {
  id,
  period,
  periodKey,
  userId,
  totalDistance,
  distanceRank,
  totalElevation,
  elevationRank,
  totalTime,
  activityCount,
  updatedAt
}
```

---

## 🔗 7. Garmin 연동

### 7.1 연동 방식 (2단계 전략)

| 우선순위 | 방식 | 설명 |
|----------|------|------|
| **1차** | garmin-connect (비공식) | 10명 이하 소규모 크루용 |
| **2차** | Health Connect + HealthKit | 1차 막히면 전환 |

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
| 텍스트효과 | CSS Animation | 반짝임, 무지개 등 |
| 암호화 | crypto-js | Garmin 비밀번호 암호화 |

---

## 📋 10. 개발 Phase

| Phase | 내용 | 기간 |
|-------|------|------|
| 1 | 프로젝트 설정 (LifeSync 복사) | 1일 |
| 2 | Garmin 연동 (비공식 라이브러리) | 2-3일 |
| 3 | 운동 목록 + 공개/비공개 + 유형표시 | 2일 |
| 4 | 포인트 시스템 + 관리자 설정 | 2일 |
| 5 | 도트 캐릭터 시스템 | 2-3일 |
| 6 | 텍스트 효과 시스템 | 1-2일 |
| 7 | 대시보드 (트랙 + 고도 위젯) | 3일 |
| 8 | 상점 + 인벤토리 + 관리자 | 2일 |
| 9 | 설정 + 캐릭터 꾸미기 | 1일 |
| 10 | 피드/일정 (재사용) | 1일 |
| 11 | 테스트 + 버그 수정 | 2일 |
| **총합** | | **19-22일** |

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

## ✅ 12. v3 → v4 변경사항 요약

| 항목 | v3 | v4 |
|------|----|----|
| 운동목록 필터 | 전체/러닝/트레일/걷기 탭 | ❌ 제거, 카드 내 유형 표시 |
| 텍스트 효과 | ❌ 없음 | ✅ 반짝임, 무지개, 불꽃 등 |
| 텍스트 효과 적용 | - | 대시보드, 피드, 운동목록 전체 |
| 상점 구분 | 캐릭터만 | 캐릭터 + 텍스트효과 탭 |
| 관리자 기능 | ❌ 없음 | ✅ 포인트 설정, 상점 관리 |
| 레이어 순서 | 캐릭터만 | 캐릭터 + 텍스트 레이어 추가 |
| 개발 기간 | 17-19일 | 19-22일 |

---
name: sprite-pipeline
description: RunningCrew 캐릭터 에셋 파이프라인. 스프라이트시트 분리, 레이어 배치, 일괄처리. 캐릭터 에셋/스프라이트/의상/장비 관련 작업 시 사용.
argument-hint: "<base|layer|batch> [파일] [옵션]"
---

# RunningCrew 캐릭터 에셋 파이프라인

캐릭터 스프라이트시트를 처리하여 `public/assets/character/` 구조에 배치하는 파이프라인.

## 핵심 규칙

### 입력 규격
- PixelLab 16프레임 스프라이트시트: **1024x1024 PNG** (4x4 그리드, 프레임당 256x256) 또는 **2048x512 등 다양**
- 사용자가 직접 만든 에셋: 다양한 해상도 (2048x2048, 2048x512 등)
- Gemini AI가 분리한 레이어: 다양한 해상도
- 투명/흰색/체크무늬/형광색 배경 모두 처리 가능
- 입력 경로: `crew-app/assets-raw/{카테고리}/`

### 출력 규격
- 스프라이트시트: **256x64 PNG** (4프레임, 프레임당 64x64)
- 투명 배경 필수
- 출력 경로: `crew-app/public/assets/character/{카테고리}/{item}-{action}-{gender}.png`
- 웹 표시: CSS `image-rendering: pixelated`로 확대, `steps(4)` 애니메이션

### 파일명 규칙

**입력** (assets-raw/):
```
base/bald-m.png, bald-f.png          ← 대머리 베이스 원본 (고해상도)
base/bald-m-64.png, bald-f-64.png    ← 64x64 리사이즈
action/run-male.png, run-female.png   ← 대머리 run 4프레임 (256x64)
action/run-male2.png, run-female2.png ← 머리있는 run 4프레임 (256x64)
hair/hair-f-raw.png, hair-m-raw.png   ← Gemini가 분리한 헤어 (고해상도)
```

**출력** (public/assets/character/):
```
base/idle-male.png, idle-female.png   ← 대머리 idle 스프라이트시트 (256x64)
base/run-male.png, run-female.png     ← 대머리 run 스프라이트시트 (256x64)
hair/default-run-male.png             ← 헤어 레이어 스프라이트시트 (256x64)
top/default-idle-male.png             ← 상의 레이어
bottom/default-idle-male.png          ← 하의 레이어
shoes/default-idle-male.png           ← 신발 레이어
```

### 레이어 시스템 (z-index 순서)
```
shadow(0) → base(10) → shoes(20) → bottom(30) → top(40) → hair(50) → hat(60) → effects(70)
```

### 애니메이션 (CSS sprite sheet 방식)
```css
@keyframes sprite-run {
  from { background-position-x: 0; }
  to { background-position-x: calc(-4 * var(--frame-size)); }
}
/* animation: sprite-run ${4/fps}s steps(4) infinite */
```
- idle: 4프레임, 8fps
- run: 4프레임, 8fps
- walk: 4프레임, 8fps

### 카테고리
| 카테고리 | 설명 |
|---------|------|
| base | 대머리 맨몸 베이스 |
| top | 상의 |
| bottom | 하의 |
| shoes | 신발 |
| hair | 머리카락 |
| hat | 모자 |

### 색상 변형
옷/머리 색상은 AI 재생성하지 않고 CSS filter로 처리:
```css
.hair-brown { filter: sepia(50%) saturate(200%) hue-rotate(15deg); }
.top-black { filter: invert(1); }
```

## 이미지 후처리 (Claude Code가 하는 일)

### 1. 배경 제거
사용자/Gemini가 준 이미지에서 배경 제거:
- **흰색 배경**: R>240 && G>240 && B>240 → 투명
- **체크무늬 배경**: 회색 교차 패턴 감지 → 투명
- **형광색 배경**: #FF00FF (마젠타) → 투명 (가장 정확)
```javascript
// 형광 마젠타 제거
if (r > 240 && g < 15 && b > 240) { /* 투명 처리 */ }
```

### 2. 리사이즈
- nearest-neighbor 보간 (픽셀아트 필수)
```javascript
sharp(input).resize(256, 64, { kernel: 'nearest' })
```

### 3. 16프레임 → 4프레임 추출
- 1행(row 1)만 사용
```javascript
for (let i = 0; i < 4; i++) {
  sharp(input).extract({ left: i * frameW, top: 0, width: frameW, height: frameH })
}
```

## 아이템 레이어 분리 방법

### ❌ diff 방식 (비추천)
대머리 vs 아이템입은 이미지 픽셀 비교 → 피부톤 차이로 지저분함

### ✅ Gemini AI 분리 (추천)
```
이 스프라이트 시트(256x64, 4프레임)에서 {부위} 부분만 추출해줘.
- {부위}가 아닌 부분은 모두 투명(alpha=0)으로 처리
- 위치(좌표)는 원본과 동일하게 유지
- 캔버스 크기 256x64 유지
- 출력: 투명 배경 PNG
```

### ✅ Photopea 수작업
1. 원본 열기
2. 형광색 배경 레이어 추가
3. Magic Wand로 몸통 선택 → 삭제
4. PNG 내보내기

## CharacterAvatar 컴포넌트 연동

```tsx
<CharacterAvatar
  gender="female"
  mode="run"
  fps={8}
  size={128}
  equipment={{
    top: "default",
    bottom: "default",
    shoes: "default",
    hair: "bob",
  }}
/>
```

equipment의 각 값 → `public/assets/character/{category}/{item}-{action}-{gender}.png` 로 매핑

## 작업 흐름

```
1. 사용자가 PixelLab에서 대머리 베이스 + 아이템 착용 스프라이트 생성
2. Gemini AI 또는 Photopea로 아이템 부분만 분리
3. assets-raw/{카테고리}/ 에 파일 배치
4. Claude Code에서 배경 제거 + 리사이즈 + public/ 배치
5. CharacterAvatar 컴포넌트가 자동으로 새 에셋 인식
```

## 스크립트/컴포넌트 경로
- 컴포넌트: `crew-app/src/components/character/CharacterAvatar.tsx`
- DB 스키마: `crew-app/src/lib/db/schema.ts` (shopItems, userInventory, userCharacters)
- 에셋 가이드: `crew-app/assets-raw/PIXELLAB_PROMPTS.md`

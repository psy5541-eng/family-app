# RunningCrew 캐릭터 에셋 온톨로지

## 개요
이 문서는 RunningCrew 앱의 캐릭터 에셋 생성을 위한 온톨로지 정의입니다.
Claude Code는 이 구조를 기반으로 PixelLab API를 호출하여 모든 에셋을 자동 생성합니다.

---

## API 설정

```yaml
pixellab:
  api_key: "71dcbf1f-33d5-41f8-bcfd-b48c8cbcbfff"
  base_url: "https://api.pixellab.ai/v1"
  models:
    text_to_pixel: "pixflux"
    animation: "animate_skeleton"  # 또는 "animate_text"
    edit: "inpaint"
  settings:
    size: 64x64
    frames: 4
    style: "pixel art, game sprite, side view, transparent background"
```

---

## 온톨로지 구조

### 1. 캐릭터 (Character)

```yaml
Character:
  properties:
    gender:
      type: enum
      values: [male, female]
      
    action:
      type: enum
      values: [idle, run, walk]
      
    frames:
      type: map
      values:
        idle: 1
        run: 4
        walk: 4
```

### 2. 레이어 시스템 (Layer System)

```yaml
LayerSystem:
  render_order:  # z-index 순서
    - shadow: 0
    - base: 10
    - shoes: 20
    - bottom: 30
    - top: 40
    - hair: 50
    - hat: 60
    - effects: 70
    
  combination_rule: "모든 레이어는 같은 action의 같은 frame끼리 겹침"
```

### 3. 레이어별 정의

#### 3.1 베이스 (Base)
```yaml
Base:
  description: "맨몸 캐릭터 (피부색, 얼굴, 손발)"
  generate_with: "pixflux"
  prompt_template: "{gender} character, running pose, nude base body, pixel art style, side view"
  
  variants:
    - id: "base_male"
      gender: male
      actions: [idle, run, walk]
      
    - id: "base_female"
      gender: female
      actions: [idle, run, walk]
      
  output_path: "/public/assets/character/base/"
  file_naming: "{gender}_{action}.png"
```

#### 3.2 머리카락 (Hair)
```yaml
Hair:
  description: "머리카락 레이어 (몸 없이 머리카락만)"
  generate_with: "pixflux"
  prompt_template: "{style} hair only, no face no body, pixel art, transparent background"
  
  styles:
    - id: "short"
      name: "짧은머리"
      target_gender: male
      
    - id: "ponytail"
      name: "포니테일"
      target_gender: female
      
    - id: "long"
      name: "긴머리"
      target_gender: female
      
  colors:
    method: "css_filter"  # AI 생성 아님, 코드로 처리
    base_color: "black"
    variants:
      - id: "black"
        filter: "none"
      - id: "brown"
        filter: "sepia(50%) saturate(200%) hue-rotate(15deg)"
      - id: "blonde"
        filter: "sepia(100%) saturate(300%) hue-rotate(15deg) brightness(1.1)"
        
  output_path: "/public/assets/character/hair/"
  file_naming: "{style}_{action}.png"
```

#### 3.3 상의 (Top)
```yaml
Top:
  description: "상의 레이어 (몸 없이 옷만)"
  generate_with: "pixflux"
  prompt_template: "{style} shirt only, no body, pixel art clothing, transparent background"
  
  styles:
    - id: "tanktop"
      name: "탱크탑"
      
    - id: "tshirt"
      name: "반팔 티셔츠"
      
    - id: "longsleeve"
      name: "긴팔"
      
  colors:
    method: "css_filter"
    base_color: "white"
    variants:
      - id: "white"
        filter: "none"
      - id: "black"
        filter: "invert(1)"
      - id: "neon_green"
        filter: "hue-rotate(80deg) saturate(200%) brightness(1.2)"
      - id: "neon_pink"
        filter: "hue-rotate(280deg) saturate(200%) brightness(1.2)"
        
  output_path: "/public/assets/character/top/"
  file_naming: "{style}_{action}.png"
```

#### 3.4 하의 (Bottom)
```yaml
Bottom:
  description: "하의 레이어 (몸 없이 옷만)"
  generate_with: "pixflux"
  prompt_template: "{style} only, no body, pixel art clothing, transparent background"
  
  styles:
    - id: "shorts"
      name: "반바지"
      
    - id: "leggings"
      name: "레깅스"
      
  colors:
    method: "css_filter"
    base_color: "black"
    variants:
      - id: "black"
        filter: "none"
      - id: "blue"
        filter: "sepia(100%) saturate(300%) hue-rotate(180deg)"
      - id: "gray"
        filter: "brightness(1.5) contrast(0.8)"
        
  output_path: "/public/assets/character/bottom/"
  file_naming: "{style}_{action}.png"
```

#### 3.5 신발 (Shoes)
```yaml
Shoes:
  description: "신발 레이어"
  generate_with: "pixflux"
  prompt_template: "{style} shoes only, pixel art, transparent background"
  
  styles:
    - id: "running"
      name: "러닝화"
      
    - id: "trail"
      name: "트레일화"
      
  colors:
    method: "css_filter"
    base_color: "white"
    variants:
      - id: "white"
        filter: "none"
      - id: "black"
        filter: "invert(1)"
      - id: "neon"
        filter: "hue-rotate(80deg) saturate(200%)"
        
  output_path: "/public/assets/character/shoes/"
  file_naming: "{style}_{action}.png"
```

#### 3.6 모자 (Hat)
```yaml
Hat:
  description: "모자 레이어"
  generate_with: "pixflux"
  prompt_template: "{style} only, no head, pixel art accessory, transparent background"
  
  styles:
    - id: "cap"
      name: "러닝캡"
      
    - id: "visor"
      name: "바이저"
      
    - id: "beanie"
      name: "비니"
      
  colors:
    method: "css_filter"
    base_color: "white"
    variants:
      - id: "white"
        filter: "none"
      - id: "black"
        filter: "invert(1)"
      - id: "red"
        filter: "sepia(100%) saturate(500%) hue-rotate(320deg)"
      - id: "blue"
        filter: "sepia(100%) saturate(500%) hue-rotate(180deg)"
        
  output_path: "/public/assets/character/hat/"
  file_naming: "{style}_{action}.png"
```

---

## 생성 규칙 (Generation Rules)

### 일관성 유지
```yaml
Consistency:
  reference_image: 
    description: "사용자가 승인한 베이스 캐릭터를 Reference로 사용"
    status: "승인됨 ✅"
    path: "/reference/base_character.png"
    note: "남자/여자 idle 포즈 - 이 스타일 기준으로 모든 에셋 생성"
    
  style_keywords:
    - "consistent pixel art style"
    - "same art direction"
    - "matching proportions"
    - "64x64 sprite"
    - "side view profile"
    - "transparent background PNG"
```

### 생성 순서
```yaml
GenerationOrder:
  1_base:
    - base_male_idle (Reference 이미지로 지정)
    - base_male_run
    - base_male_walk
    - base_female_idle
    - base_female_run
    - base_female_walk
    
  2_hair:
    - short (all actions)
    - ponytail (all actions)
    - long (all actions)
    
  3_clothing:
    - top styles (all actions)
    - bottom styles (all actions)
    - shoes styles (all actions)
    
  4_accessories:
    - hat styles (all actions)
```

---

## 출력 구조 (Output Structure)

```
/public/assets/character/
├── base/
│   ├── male_idle.png
│   ├── male_run.png      # 4프레임 스프라이트시트
│   ├── male_walk.png     # 4프레임 스프라이트시트
│   ├── female_idle.png
│   ├── female_run.png
│   └── female_walk.png
├── hair/
│   ├── short_idle.png
│   ├── short_run.png
│   ├── short_walk.png
│   ├── ponytail_idle.png
│   ├── ponytail_run.png
│   ├── ponytail_walk.png
│   ├── long_idle.png
│   ├── long_run.png
│   └── long_walk.png
├── top/
│   ├── tanktop_{action}.png
│   ├── tshirt_{action}.png
│   └── longsleeve_{action}.png
├── bottom/
│   ├── shorts_{action}.png
│   └── leggings_{action}.png
├── shoes/
│   ├── running_{action}.png
│   └── trail_{action}.png
└── hat/
    ├── cap_{action}.png
    ├── visor_{action}.png
    └── beanie_{action}.png
```

---

## CSS 색상 처리 (Color System)

```css
/* 컴포넌트에서 색상 적용 예시 */
.hair-black { filter: none; }
.hair-brown { filter: sepia(50%) saturate(200%) hue-rotate(15deg); }
.hair-blonde { filter: sepia(100%) saturate(300%) hue-rotate(15deg) brightness(1.1); }

.top-white { filter: none; }
.top-black { filter: invert(1); }
.top-neon-green { filter: hue-rotate(80deg) saturate(200%) brightness(1.2); }

/* 이미지 픽셀 유지 */
.pixel-art {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

---

## 스프라이트 애니메이션 (Animation)

```css
/* 4프레임 애니메이션 */
@keyframes sprite-run {
  from { background-position: 0 0; }
  to { background-position: -256px 0; } /* 64px × 4프레임 */
}

.character-running {
  width: 64px;
  height: 64px;
  animation: sprite-run 0.4s steps(4) infinite;
}
```

---

## 실행 모드 (Execution Mode)

### ⚠️ 중요: 단계별 승인 필수!

```yaml
ExecutionMode:
  type: "step_by_step_approval"
  description: "각 단계마다 사용자 승인 후 다음 단계 진행"
  
  workflow:
    step_1:
      name: "베이스 캐릭터 샘플"
      action: "base_male_idle 1개만 생성"
      wait_for: "사용자 승인"
      on_reject: "프롬프트 수정 후 재생성"
      
    step_2:
      name: "베이스 전체"
      action: "승인된 스타일로 나머지 베이스 생성"
      items: [base_male_run, base_male_walk, base_female_idle, base_female_run, base_female_walk]
      wait_for: "사용자 승인"
      
    step_3:
      name: "레이어 샘플"
      action: "각 레이어 1개씩만 샘플 생성"
      items: [hair_short_idle, top_tshirt_idle, bottom_shorts_idle, shoes_running_idle, hat_cap_idle]
      wait_for: "사용자 승인"
      
    step_4:
      name: "레이어 전체"
      action: "승인된 스타일로 모든 레이어 생성"
      wait_for: "사용자 최종 확인"
```

### 금지 사항
```yaml
Prohibited:
  - "승인 없이 다음 단계 진행 금지"
  - "한 번에 전체 생성 금지"
  - "사용자 확인 없이 파일 저장 금지"
```

---

## 실행 명령 (Execution Command)

Claude Code에게 전달:

```
이 온톨로지 파일을 기반으로 PixelLab API를 호출해줘.

⚠️ 단계별 승인 모드로 진행:

1. 먼저 base_male_idle 샘플 1개만 생성해서 보여줘
2. 내가 "OK" 하면 다음 단계 진행
3. 수정 요청하면 프롬프트 조정 후 재생성
4. 각 단계마다 반드시 내 승인 대기

절대 한 번에 다 만들지 마!
```

---

## 예상 비용

| 카테고리 | 생성 수 | 비용 (64x64) |
|----------|---------|--------------|
| Base | 6 | $0.09 |
| Hair | 9 | $0.13 |
| Top | 9 | $0.13 |
| Bottom | 6 | $0.09 |
| Shoes | 6 | $0.09 |
| Hat | 9 | $0.13 |
| 재시도 여유 | ~20 | $0.30 |
| **총계** | **~65** | **~$1.00** |

색상 변형: CSS 처리 = **$0**

---

## 버전
- v1.0 - 2026.03.13 초기 작성

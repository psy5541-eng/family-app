# PixelLab 프롬프트 가이드

## 공통 규칙
- **스타일 키워드**: `chibi pixel art, side view, transparent background`
- **사이즈**: 64x64
- **기본 방향**: 왼쪽을 바라보는 옆모습 (side view facing left)
- **대머리 베이스를 항상 레퍼런스로 사용** (머리카락 있는 베이스 사용 금지)

---

## 현재 확정된 워크플로우 (2026-03-13 기준)

### 베이스 캐릭터 생성
1. **PixelLab 에디터에서 대머리 베이스 1프레임 직접 제작** (API 자동 생성 실패 — 머리카락 안 벗겨짐)
2. PixelLab 16프레임 스프라이트시트로 idle/run/walk 생성
3. 1행 4프레임 추출 → 256x64 스프라이트시트

### 아이템 레이어 생성 (헤어/옷/신발)
```
[PixelLab] 대머리 베이스에 아이템 1개만 입힌 16프레임 스프라이트 생성
    ↓
1행 4프레임 추출 → 256x64 (아이템 입은 전신)
    ↓
[Gemini/Photopea] 아이템 부분만 분리 (몸통 제거, 투명 배경)
    ↓
[Claude Code] 배경색 제거 + 256x64 리사이즈 + 위치 정렬
    ↓
public/assets/character/{category}/{item}-{action}-{gender}.png
```

**핵심**: diff 방식은 피부톤 차이로 지저분함 → **Gemini/Photopea로 수작업 분리가 정확**

### 분리 방법 (우선순위)
1. **Gemini AI**: 스프라이트시트 이미지 주고 "머리카락만 추출, 나머지 투명" 프롬프트 → 가장 빠름
2. **Photopea 수작업**: Magic Wand로 몸통 선택 → 삭제 → 아이템만 남김
3. **형광색 배경 방식**: 몸통 영역을 #FF00FF로 칠한 이미지 → Claude Code에서 형광색만 투명 처리

### Gemini용 프롬프트 템플릿
```
이 스프라이트 시트(256x64, 4프레임)에서 {부위} 부분만 추출해줘.
- 몸, 얼굴, 눈, 입 등 {부위}가 아닌 부분은 모두 투명(alpha=0)으로 처리
- {부위}의 위치(좌표)는 원본과 동일하게 유지
- 캔버스 크기 256x64 유지
- 출력: 투명 배경 PNG
```

| 부위 | {부위} 값 |
|------|----------|
| 헤어 | 머리카락 |
| 상의 | 상의(티셔츠/옷) |
| 하의 | 하의(바지/반바지) |
| 신발 | 신발 |
| 모자 | 모자 |

### Claude Code가 받은 이미지 후처리
```
assets-raw/hair/ 에 Gemini 결과 넣어놨어.
배경(흰색/체크무늬/형광색) 제거하고 256x64로 리사이즈해서
public/assets/character/hair/ 에 저장해줘.
```

---

## PixelLab 에디터 프롬프트

### 헤어 (Hair)
| 아이템 | 프롬프트 |
|--------|----------|
| 남자 기본 (short) | `short brown hair` |
| 여자 단발 (bob) | `short bob brown hair` |
| 포니테일 (ponytail) | `long ponytail dark brown hair` |
| 긴머리 (long) | `long flowing dark brown hair` |

### 상의 (Top)
| 아이템 | 프롬프트 |
|--------|----------|
| 흰 티셔츠 (default) | `white t-shirt` |
| 빨간 티셔츠 (red-tshirt) | `red t-shirt` |
| 탱크탑 (tanktop) | `white tank top` |
| FRY 싱글렛 | `yellow running singlet` |

### 하의 (Bottom)
| 아이템 | 프롬프트 |
|--------|----------|
| 파란 반바지 (default) | `blue shorts` |
| 검정 반바지 (black-shorts) | `black shorts` |
| 레깅스 (leggings) | `black leggings` |

### 신발 (Shoes)
| 아이템 | 프롬프트 |
|--------|----------|
| 기본 러닝화 (default) | `white running shoes` |
| 빨간 러닝화 (red-shoes) | `red running shoes` |

### 모자 (Hat)
| 아이템 | 프롬프트 |
|--------|----------|
| 러닝캡 (cap) | `white running cap` |
| 바이저 (visor) | `white sun visor` |
| 비니 (beanie) | `black beanie` |

---

## PixelLab API 파라미터 참고

| 엔드포인트 | 용도 | 핵심 파라미터 |
|-----------|------|-------------|
| `/inpaint` | 부분 편집 (에디터에서 수작업) | `inpainting_image`, `mask_image`, `description`, `text_guidance_scale: 3.0` |
| `/estimate-skeleton` | 기존 프레임에서 스켈레톤 추출 | `image` (투명배경 캐릭터) |
| `/animate-with-skeleton` | 1프레임 → 4프레임 | `reference_image`, `skeleton_keypoints`, `guidance_scale: 4.0` |
| `/generate-image-pixflux` | 새 이미지 생성 | `description`, `init_image`, `text_guidance_scale: 8.0`, `no_background: true` |

### skeleton API 주의사항
- `estimate-skeleton` → `z_index` 값이 float로 나옴 → **반드시 Math.round()** 후 전달
- `animate-with-skeleton` → reference_image가 프레임 1, **나머지 3프레임만** skeleton 전달 (4개 보내면 에러: "Expected 3 pose images, got 4")
- 이미지는 **base64** 인코딩으로 전달
- API 자동 생성으로 대머리 캐릭터 뽑기는 실패 (항상 머리카락 생성됨)

### PixelLab API 한계
- `generate-image-pixflux`로 "bald/no hair" 지시해도 머리카락이 생성됨
- `init_image` 사용 시 원본 특징(머리카락 등)을 그대로 복사하는 경향
- 대머리 베이스는 **수작업(Photopea/PixelLab 에디터)이 유일한 방법**

---

## 작업 순서

```
1. [사용자] 대머리 베이스 남/여 제작 (PixelLab 에디터/Photopea)
2. [사용자] PixelLab 16프레임 스프라이트시트 생성 (idle/run/walk)
3. [Claude] 1행 4프레임 추출 → 256x64 base 스프라이트시트
4. [사용자] 대머리 + 아이템 1개 입힌 16프레임 생성
5. [사용자/Gemini] 아이템 부분만 분리 (투명 배경 PNG)
6. [Claude] 배경 제거 + 리사이즈 + 위치 정렬 → public/ 배치
→ 반복하여 아이템 확장
```

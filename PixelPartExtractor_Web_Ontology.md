# PixelPart Extractor - 웹 기반 온톨로지 v2

## 개요
픽셀아트 캐릭터에서 텍스트 프롬프트 기반으로 파츠(옷, 헤어, 신발 등)를 자동 추출하는 **웹 도구**

---

## 목적

```yaml
Problem:
  - PixelLab에서 옷 입힌 캐릭터 생성은 가능
  - 하지만 파츠별 분리(누끼)가 안 됨
  - 수작업 분리는 너무 오래 걸림

Solution:
  - 웹 브라우저에서 이미지 업로드
  - "흰 티셔츠" 입력 → AI가 자동 추출
  - 투명 배경 PNG 다운로드
```

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────┐
│           브라우저 (Gradio UI)               │
│  ┌─────────────────────────────────────┐    │
│  │  📁 이미지 업로드                    │    │
│  │  📝 프롬프트: "white t-shirt"       │    │
│  │  🎯 [추출하기] 버튼                  │    │
│  │  🖼️ 결과 미리보기                   │    │
│  │  💾 [다운로드] 버튼                  │    │
│  └─────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │ HTTP (localhost:7860)
                   ▼
┌─────────────────────────────────────────────┐
│           Python Backend                     │
│  ┌─────────────────────────────────────┐    │
│  │  Gradio Server                       │    │
│  │  └── Lang-SAM Model (GPU)           │    │
│  │       └── GroundingDINO             │    │
│  │       └── SAM                        │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  🖥️ NVIDIA RTX 3080 Ti (12GB VRAM)         │
└─────────────────────────────────────────────┘
```

---

## 기술 스택

```yaml
Frontend:
  - Gradio 4.x (Python 기반 웹 UI)
  
Backend:
  - Python 3.10+
  - Lang-SAM (GroundingDINO + SAM)
  
AI Models:
  - GroundingDINO: 텍스트 → 바운딩 박스
  - SAM (vit_h): 바운딩 박스 → 정밀 마스크
  
Hardware:
  - NVIDIA RTX 3080 Ti (12GB VRAM) ✅
  - CUDA 11.8+
```

---

## 프로젝트 구조

```
pixel-part-extractor/
├── app.py                 # Gradio 웹 앱 (메인 진입점)
├── extractor.py           # Lang-SAM 추출 로직
├── spritesheet.py         # 스프라이트시트 처리
├── utils.py               # 유틸리티 함수
├── config.py              # 설정
├── requirements.txt       # 의존성
├── input/                 # 테스트 이미지
├── output/                # 추출 결과
└── README.md
```

---

## 의존성 (requirements.txt)

```txt
torch>=2.0.0
torchvision>=0.15.0
gradio>=4.0.0
lang-sam
Pillow>=9.0.0
numpy>=1.24.0
opencv-python>=4.7.0
```

---

## 핵심 모듈 정의

### 1. config.py

```python
CONFIG = {
    # 모델 설정
    "sam_type": "vit_h",           # vit_h (정확) / vit_b (빠름)
    "device": "cuda",               # cuda / cpu
    
    # 추출 설정
    "box_threshold": 0.3,           # 바운딩박스 감지 임계값
    "text_threshold": 0.25,         # 텍스트 매칭 임계값
    
    # 서버 설정
    "server_port": 7860,
    "share": False,                 # True면 공개 URL 생성
    
    # 프리셋 프롬프트
    "presets": {
        "상의": ["white t-shirt", "black t-shirt", "tank top", "long sleeve"],
        "하의": ["blue shorts", "black shorts", "leggings"],
        "신발": ["sneakers", "running shoes", "trail shoes"],
        "헤어": ["short hair", "ponytail", "long hair", "bald head"]
    }
}
```

### 2. extractor.py

```python
"""
Lang-SAM 기반 파츠 추출기
"""
from lang_sam import LangSAM
from PIL import Image
import numpy as np

class PixelPartExtractor:
    """텍스트 기반 픽셀아트 파츠 추출기"""
    
    def __init__(self, sam_type="vit_h", device="cuda"):
        """
        Args:
            sam_type: SAM 모델 타입 (vit_h, vit_l, vit_b)
            device: cuda 또는 cpu
        """
        self.model = LangSAM(sam_type)
        self.device = device
        
    def extract(self, image: Image.Image, prompt: str, 
                box_threshold: float = 0.3,
                text_threshold: float = 0.25) -> Image.Image:
        """
        이미지에서 프롬프트에 해당하는 영역 추출
        
        Args:
            image: PIL Image
            prompt: 추출할 대상 ("white t-shirt" 등)
            box_threshold: 바운딩박스 임계값
            text_threshold: 텍스트 매칭 임계값
            
        Returns:
            추출된 영역 (투명 배경 PNG)
        """
        # Lang-SAM 실행
        masks, boxes, phrases, logits = self.model.predict(
            image, prompt, 
            box_threshold=box_threshold,
            text_threshold=text_threshold
        )
        
        if len(masks) == 0:
            return None  # 감지 실패
            
        # 첫 번째 마스크 사용
        mask = masks[0].cpu().numpy()
        
        # RGBA 이미지 생성
        img_array = np.array(image)
        result = np.zeros((img_array.shape[0], img_array.shape[1], 4), dtype=np.uint8)
        
        # 마스크 영역만 복사
        result[mask] = np.concatenate([
            img_array[mask],
            np.full((mask.sum(), 1), 255, dtype=np.uint8)
        ], axis=1)
        
        return Image.fromarray(result, 'RGBA')
    
    def extract_multiple(self, image: Image.Image, 
                         prompts: dict) -> dict:
        """
        여러 파츠 한 번에 추출
        
        Args:
            image: PIL Image
            prompts: {"top": "white t-shirt", "bottom": "blue shorts"}
            
        Returns:
            {"top": Image, "bottom": Image, ...}
        """
        results = {}
        for name, prompt in prompts.items():
            results[name] = self.extract(image, prompt)
        return results
```

### 3. spritesheet.py

```python
"""
스프라이트시트 처리
"""
from PIL import Image
from typing import List, Tuple

def split_spritesheet(image: Image.Image, 
                      frame_width: int, 
                      frame_height: int) -> List[Image.Image]:
    """
    스프라이트시트를 개별 프레임으로 분리
    
    Args:
        image: 스프라이트시트 이미지
        frame_width: 프레임 너비
        frame_height: 프레임 높이
        
    Returns:
        프레임 이미지 리스트
    """
    frames = []
    img_width, img_height = image.size
    
    cols = img_width // frame_width
    rows = img_height // frame_height
    
    for row in range(rows):
        for col in range(cols):
            left = col * frame_width
            top = row * frame_height
            right = left + frame_width
            bottom = top + frame_height
            
            frame = image.crop((left, top, right, bottom))
            frames.append(frame)
            
    return frames

def merge_frames(frames: List[Image.Image], 
                 cols: int = None) -> Image.Image:
    """
    프레임들을 스프라이트시트로 합치기
    
    Args:
        frames: 프레임 이미지 리스트
        cols: 열 개수 (None이면 한 줄로)
        
    Returns:
        스프라이트시트 이미지
    """
    if not frames:
        return None
        
    if cols is None:
        cols = len(frames)
        
    rows = (len(frames) + cols - 1) // cols
    
    frame_width = frames[0].width
    frame_height = frames[0].height
    
    result = Image.new('RGBA', (cols * frame_width, rows * frame_height), (0, 0, 0, 0))
    
    for i, frame in enumerate(frames):
        col = i % cols
        row = i // cols
        result.paste(frame, (col * frame_width, row * frame_height))
        
    return result
```

### 4. app.py (Gradio 웹 앱)

```python
"""
Gradio 웹 인터페이스
"""
import gradio as gr
from PIL import Image
from extractor import PixelPartExtractor
from spritesheet import split_spritesheet, merge_frames
from config import CONFIG

# 모델 로드 (앱 시작 시 1회)
print("🔄 Loading Lang-SAM model...")
extractor = PixelPartExtractor(
    sam_type=CONFIG["sam_type"],
    device=CONFIG["device"]
)
print("✅ Model loaded!")

def extract_part(image, prompt, box_threshold, text_threshold):
    """단일 이미지에서 파츠 추출"""
    if image is None:
        return None, "이미지를 업로드해주세요"
        
    result = extractor.extract(
        Image.fromarray(image),
        prompt,
        box_threshold=box_threshold,
        text_threshold=text_threshold
    )
    
    if result is None:
        return None, f"'{prompt}' 영역을 찾지 못했습니다. 임계값을 낮춰보세요."
        
    return result, f"✅ '{prompt}' 추출 완료!"

def extract_from_spritesheet(image, prompt, frame_width, frame_height, 
                              box_threshold, text_threshold):
    """스프라이트시트에서 파츠 추출"""
    if image is None:
        return None, "이미지를 업로드해주세요"
    
    pil_image = Image.fromarray(image)
    
    # 프레임 분리
    frames = split_spritesheet(pil_image, int(frame_width), int(frame_height))
    
    # 각 프레임에서 추출
    extracted_frames = []
    for i, frame in enumerate(frames):
        result = extractor.extract(
            frame, prompt,
            box_threshold=box_threshold,
            text_threshold=text_threshold
        )
        if result:
            extracted_frames.append(result)
        else:
            # 실패 시 빈 프레임
            extracted_frames.append(
                Image.new('RGBA', (int(frame_width), int(frame_height)), (0,0,0,0))
            )
    
    # 다시 합치기
    result_sheet = merge_frames(extracted_frames, cols=len(frames))
    
    return result_sheet, f"✅ {len(frames)}개 프레임에서 '{prompt}' 추출 완료!"

def batch_extract(image, box_threshold, text_threshold):
    """여러 파츠 한 번에 추출"""
    if image is None:
        return None, None, None, None, "이미지를 업로드해주세요"
    
    pil_image = Image.fromarray(image)
    
    results = {
        "top": extractor.extract(pil_image, "shirt", box_threshold, text_threshold),
        "bottom": extractor.extract(pil_image, "shorts pants", box_threshold, text_threshold),
        "shoes": extractor.extract(pil_image, "shoes sneakers", box_threshold, text_threshold),
        "hair": extractor.extract(pil_image, "hair", box_threshold, text_threshold),
    }
    
    return results["top"], results["bottom"], results["shoes"], results["hair"], "✅ 일괄 추출 완료!"

# Gradio UI
with gr.Blocks(title="PixelPart Extractor", theme=gr.themes.Soft()) as app:
    gr.Markdown("""
    # 🎨 PixelPart Extractor
    픽셀아트 캐릭터에서 파츠를 AI로 자동 추출합니다.
    """)
    
    with gr.Tabs():
        # 탭 1: 단일 추출
        with gr.Tab("🎯 단일 추출"):
            with gr.Row():
                with gr.Column():
                    input_image = gr.Image(label="이미지 업로드")
                    prompt = gr.Textbox(
                        label="추출할 파츠",
                        placeholder="예: white t-shirt, blue shorts, sneakers..."
                    )
                    with gr.Row():
                        box_th = gr.Slider(0.1, 0.9, value=0.3, label="Box Threshold")
                        text_th = gr.Slider(0.1, 0.9, value=0.25, label="Text Threshold")
                    extract_btn = gr.Button("🎯 추출하기", variant="primary")
                    
                with gr.Column():
                    output_image = gr.Image(label="추출 결과", type="pil")
                    status = gr.Textbox(label="상태")
                    
            extract_btn.click(
                fn=extract_part,
                inputs=[input_image, prompt, box_th, text_th],
                outputs=[output_image, status]
            )
        
        # 탭 2: 스프라이트시트
        with gr.Tab("🎬 스프라이트시트"):
            with gr.Row():
                with gr.Column():
                    sheet_image = gr.Image(label="스프라이트시트 업로드")
                    sheet_prompt = gr.Textbox(
                        label="추출할 파츠",
                        placeholder="예: white t-shirt"
                    )
                    with gr.Row():
                        frame_w = gr.Number(value=64, label="프레임 너비")
                        frame_h = gr.Number(value=64, label="프레임 높이")
                    with gr.Row():
                        sheet_box_th = gr.Slider(0.1, 0.9, value=0.3, label="Box Threshold")
                        sheet_text_th = gr.Slider(0.1, 0.9, value=0.25, label="Text Threshold")
                    sheet_btn = gr.Button("🎬 추출하기", variant="primary")
                    
                with gr.Column():
                    sheet_output = gr.Image(label="추출 결과", type="pil")
                    sheet_status = gr.Textbox(label="상태")
                    
            sheet_btn.click(
                fn=extract_from_spritesheet,
                inputs=[sheet_image, sheet_prompt, frame_w, frame_h, sheet_box_th, sheet_text_th],
                outputs=[sheet_output, sheet_status]
            )
        
        # 탭 3: 일괄 추출
        with gr.Tab("📦 일괄 추출"):
            with gr.Row():
                with gr.Column():
                    batch_image = gr.Image(label="이미지 업로드")
                    with gr.Row():
                        batch_box_th = gr.Slider(0.1, 0.9, value=0.3, label="Box Threshold")
                        batch_text_th = gr.Slider(0.1, 0.9, value=0.25, label="Text Threshold")
                    batch_btn = gr.Button("📦 전체 추출", variant="primary")
                    
                with gr.Column():
                    with gr.Row():
                        out_top = gr.Image(label="👕 상의", type="pil")
                        out_bottom = gr.Image(label="👖 하의", type="pil")
                    with gr.Row():
                        out_shoes = gr.Image(label="👟 신발", type="pil")
                        out_hair = gr.Image(label="💇 헤어", type="pil")
                    batch_status = gr.Textbox(label="상태")
                    
            batch_btn.click(
                fn=batch_extract,
                inputs=[batch_image, batch_box_th, batch_text_th],
                outputs=[out_top, out_bottom, out_shoes, out_hair, batch_status]
            )
    
    gr.Markdown("""
    ---
    ### 💡 팁
    - **Box Threshold**: 낮출수록 더 많이 감지 (0.2~0.4 권장)
    - **Text Threshold**: 낮출수록 텍스트 매칭 관대해짐
    - 픽셀아트는 해상도가 낮아 감지가 어려울 수 있음
    - 구체적인 프롬프트 사용 권장 (예: "white running t-shirt")
    """)

# 실행
if __name__ == "__main__":
    app.launch(
        server_port=CONFIG["server_port"],
        share=CONFIG["share"]
    )
```

---

## 설치 및 실행

### 1. 환경 설정

```bash
# 프로젝트 폴더 생성
mkdir pixel-part-extractor
cd pixel-part-extractor

# 가상환경 생성
python -m venv venv

# 활성화
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# PyTorch 설치 (CUDA 11.8 기준)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# 나머지 의존성
pip install gradio lang-sam Pillow numpy opencv-python
```

### 2. 실행

```bash
python app.py
```

### 3. 접속

```
브라우저에서: http://localhost:7860
```

---

## 사용 워크플로우

### 단일 이미지 추출

```
1. "단일 추출" 탭
2. 캐릭터 이미지 업로드
3. 프롬프트 입력: "white t-shirt"
4. [추출하기] 클릭
5. 결과 확인 및 다운로드
```

### 스프라이트시트 추출

```
1. "스프라이트시트" 탭
2. 4프레임 스프라이트시트 업로드
3. 프레임 크기 입력: 64 x 64
4. 프롬프트 입력: "white t-shirt"
5. [추출하기] 클릭
6. 모든 프레임에서 추출된 결과 확인
```

### 일괄 추출

```
1. "일괄 추출" 탭
2. 캐릭터 이미지 업로드
3. [전체 추출] 클릭
4. 상의/하의/신발/헤어 한 번에 추출
```

---

## 예상 성능

```yaml
Hardware: RTX 3080 Ti

SingleImage:
  - 첫 실행: ~5초 (모델 워밍업)
  - 이후: ~1초/이미지

Spritesheet (4 frames):
  - ~4초 (프레임당 1초)

Memory:
  - VRAM: ~4GB (vit_h 모델)
```

---

## 문제 해결

```yaml
"CUDA out of memory":
  → config.py에서 sam_type을 "vit_b"로 변경 (더 작은 모델)
  
"영역을 찾지 못함":
  → box_threshold를 0.2로 낮춤
  → 프롬프트를 더 구체적으로 ("white cotton t-shirt")
  
"픽셀아트 감지 안 됨":
  → 이미지를 4배 업스케일 후 시도
  → 단색 배경 사용
```

---

## 향후 확장

```yaml
v2.0:
  - 색상 변환 기능 (추출 후 CSS filter)
  - 레이어 조합 미리보기
  - RunningCrew 앱 직접 연동
  
v3.0:
  - 웹 배포 (Hugging Face Spaces)
  - 모델 경량화 (ONNX)
```

---

## Claude Code 실행 명령

```
이 온톨로지 파일 읽고 pixel-part-extractor 프로젝트 만들어줘.

1. 프로젝트 폴더 및 파일 구조 생성
2. requirements.txt 작성
3. config.py, extractor.py, spritesheet.py, app.py 구현
4. 가상환경 생성 및 의존성 설치
5. 실행 테스트

GPU: NVIDIA RTX 3080 Ti
CUDA: 가능
```

---

## 버전
- v1.0 - 2026.03.13 CLI 버전
- v2.0 - 2026.03.13 웹 기반 (Gradio)

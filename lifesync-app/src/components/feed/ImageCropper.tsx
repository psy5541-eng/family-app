"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type AspectRatio = "original" | "1:1" | "4:5" | "16:9";

const RATIOS: { label: string; value: AspectRatio; ratio?: number }[] = [
  { label: "원본", value: "original" },
  { label: "1:1", value: "1:1", ratio: 1 },
  { label: "4:5", value: "4:5", ratio: 4 / 5 },
  { label: "16:9", value: "16:9", ratio: 16 / 9 },
];

type ImageCropperProps = {
  file: File;
  onCropped: (croppedFile: File) => void;
  onCancel: () => void;
};

export default function ImageCropper({ file, onCropped, onCancel }: ImageCropperProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [aspect, setAspect] = useState<AspectRatio>("original");
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, startY: 0, startOffX: 0, startOffY: 0, dragging: false });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // 컨테이너 크기와 이미지 표시 크기 계산
  const containerWidth = 320;
  const selectedRatio = RATIOS.find((r) => r.value === aspect);
  const containerHeight = selectedRatio?.ratio
    ? containerWidth / selectedRatio.ratio
    : imgSize.h > 0
      ? (containerWidth / imgSize.w) * imgSize.h
      : containerWidth;

  // 이미지가 컨테이너를 커버하도록 스케일 계산
  const scale = imgSize.w > 0
    ? Math.max(containerWidth / imgSize.w, containerHeight / imgSize.h)
    : 1;
  const displayW = imgSize.w * scale;
  const displayH = imgSize.h * scale;

  // 오프셋 제한
  const clampOffset = useCallback(
    (ox: number, oy: number) => ({
      x: Math.min(0, Math.max(containerWidth - displayW, ox)),
      y: Math.min(0, Math.max(containerHeight - displayH, oy)),
    }),
    [containerWidth, containerHeight, displayW, displayH]
  );

  // 비율 변경 시 오프셋 리셋
  useEffect(() => {
    setOffset(clampOffset(-(displayW - containerWidth) / 2, -(displayH - containerHeight) / 2));
  }, [aspect, displayW, displayH, containerWidth, containerHeight, clampOffset]);

  // 드래그
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffX: offset.x, startOffY: offset.y, dragging: true };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(clampOffset(dragRef.current.startOffX + dx, dragRef.current.startOffY + dy));
  };

  const handlePointerUp = () => {
    dragRef.current.dragging = false;
  };

  // 크롭 실행
  async function handleCrop() {
    setIsCropping(true);
    try {
      const canvas = document.createElement("canvas");
      // 원본 이미지 기준 크롭 영역 계산
      const srcX = -offset.x / scale;
      const srcY = -offset.y / scale;
      const srcW = containerWidth / scale;
      const srcH = containerHeight / scale;

      // 출력 크기 (최대 1080px)
      const maxOut = 1080;
      const outW = Math.min(srcW, maxOut);
      const outH = (outW / srcW) * srcH;
      canvas.width = outW;
      canvas.height = outH;

      const ctx = canvas.getContext("2d")!;
      const img = new Image();
      img.src = imageUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/webp", 0.85)
      );
      const croppedFile = new File([blob], file.name.replace(/\.\w+$/, ".webp"), { type: "image/webp" });
      onCropped(croppedFile);
    } finally {
      setIsCropping(false);
    }
  }

  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden max-w-sm w-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <button onClick={onCancel} className="text-sm text-gray-600 dark:text-gray-400">취소</button>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">사진 조절</h3>
          <button
            onClick={handleCrop}
            disabled={isCropping}
            className="text-sm font-semibold text-primary-600 disabled:text-gray-400"
          >
            {isCropping ? "처리중..." : "완료"}
          </button>
        </div>

        {/* 크롭 영역 */}
        <div className="flex justify-center bg-gray-900 p-4">
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-lg cursor-move"
            style={{ width: containerWidth, height: containerHeight }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="크롭 미리보기"
              className="absolute select-none pointer-events-none"
              style={{
                width: displayW,
                height: displayH,
                left: offset.x,
                top: offset.y,
              }}
              draggable={false}
            />
            {/* 그리드 오버레이 */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
            </div>
          </div>
        </div>

        {/* 비율 선택 */}
        <div className="flex justify-center gap-2 px-4 py-3">
          {RATIOS.map((r) => (
            <button
              key={r.value}
              onClick={() => setAspect(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                aspect === r.value
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

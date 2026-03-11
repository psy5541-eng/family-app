"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { registerBackHandler } from "@/hooks/useBackButton";

type ImageViewerProps = {
  src: string;
  onClose: () => void;
};

export default function ImageViewer({ src, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 핀치 상태
  const pinchRef = useRef({
    active: false,
    startDist: 0,
    startScale: 1,
  });

  // 드래그 상태
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startTx: 0,
    startTy: 0,
  });

  // 뒤로가기 핸들러 등록
  useEffect(() => {
    const unregister = registerBackHandler(onClose);
    return unregister;
  }, [onClose]);

  // ESC 키로 닫기
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // 두 손가락 사이 거리
  function getDistance(t1: React.Touch, t2: React.Touch) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        // 핀치 시작
        e.preventDefault();
        pinchRef.current = {
          active: true,
          startDist: getDistance(e.touches[0], e.touches[1]),
          startScale: scale,
        };
      } else if (e.touches.length === 1 && scale > 1) {
        // 드래그 시작 (확대 상태에서만)
        dragRef.current = {
          active: true,
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          startTx: translate.x,
          startTy: translate.y,
        };
      }
    },
    [scale, translate]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (pinchRef.current.active && e.touches.length === 2) {
        e.preventDefault();
        const dist = getDistance(e.touches[0], e.touches[1]);
        const ratio = dist / pinchRef.current.startDist;
        const newScale = Math.min(Math.max(pinchRef.current.startScale * ratio, 1), 5);
        setScale(newScale);
      } else if (dragRef.current.active && e.touches.length === 1) {
        const dx = e.touches[0].clientX - dragRef.current.startX;
        const dy = e.touches[0].clientY - dragRef.current.startY;
        setTranslate({
          x: dragRef.current.startTx + dx,
          y: dragRef.current.startTy + dy,
        });
      }
    },
    []
  );

  const handleTouchEnd = useCallback(() => {
    pinchRef.current.active = false;
    dragRef.current.active = false;

    // 축소 시 원위치
    if (scale <= 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  }, [scale]);

  // 더블탭으로 확대/축소 토글
  const lastTapRef = useRef(0);
  const handleTap = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length > 0) return; // touchEnd에서만

      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        if (scale > 1) {
          setScale(1);
          setTranslate({ x: 0, y: 0 });
        } else {
          setScale(2.5);
        }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    },
    [scale]
  );

  // 배경 탭으로 닫기 (확대 안 된 상태에서 싱글탭)
  const singleTapTimer = useRef<ReturnType<typeof setTimeout>>();
  const handleContainerClick = useCallback(() => {
    if (scale > 1) return;
    // 더블탭 구분을 위해 지연
    if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
    singleTapTimer.current = setTimeout(() => {
      onClose();
    }, 350);
  }, [scale, onClose]);

  // 더블탭 시 싱글탭 타이머 취소
  useEffect(() => {
    return () => {
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      onClick={handleContainerClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={(e) => {
        handleTouchEnd();
        handleTap(e);
      }}
      style={{ touchAction: "none" }}
    >
      {/* 닫기 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white"
        aria-label="닫기"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 확대 힌트 */}
      {scale === 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-xs pointer-events-none">
          핀치로 확대 / 더블탭으로 확대 / 탭하여 닫기
        </div>
      )}

      {/* 이미지 로딩 */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* 이미지 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="확대 이미지"
        className={`max-w-full max-h-full object-contain select-none transition-opacity duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transition: pinchRef.current.active || dragRef.current.active ? "none" : "transform 0.2s ease-out",
        }}
        draggable={false}
        onLoad={() => setImageLoaded(true)}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

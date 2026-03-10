"use client";

import { useState, useRef, useCallback } from "react";
import type { FeedMedia } from "@/types/db";

type MediaCarouselProps = {
  media: FeedMedia[];
  onDoubleTap?: () => void;
};

function MediaImage({ src, alt }: { src: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="w-full h-auto block" />;
}

function HeartAnimation({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <svg
        className="w-20 h-20 text-white drop-shadow-lg animate-heart-pop"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    </div>
  );
}

export default function MediaCarousel({ media, onDoubleTap }: MediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);
  const heartTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // 더블탭 감지
      onDoubleTap?.();
      setShowHeart(true);
      if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
      heartTimerRef.current = setTimeout(() => setShowHeart(false), 800);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [onDoubleTap]);

  if (!media.length) return null;

  // 단일 미디어
  if (media.length === 1) {
    const item = media[0];
    return (
      <div className="relative w-full bg-black" onClick={handleTap}>
        {item.mediaType === "video" ? (
          <video
            src={item.mediaUrl}
            className="w-full h-auto"
            controls
            playsInline
          />
        ) : (
          <MediaImage src={item.mediaUrl} alt="피드 이미지" />
        )}
        <HeartAnimation show={showHeart} />
      </div>
    );
  }

  return (
    <div className="relative" onClick={handleTap}>
      {/* 스크롤 컨테이너 */}
      <div
        className="flex overflow-x-auto scroll-snap-x scrollbar-hide"
        onScroll={(e) => {
          const el = e.currentTarget;
          const index = Math.round(el.scrollLeft / el.clientWidth);
          setActiveIndex(index);
        }}
      >
        {media.map((item) => (
          <div
            key={item.id}
            className="scroll-snap-start flex-shrink-0 w-full bg-black"
          >
            {item.mediaType === "video" ? (
              <video
                src={item.mediaUrl}
                className="w-full h-auto"
                controls
                playsInline
              />
            ) : (
              <MediaImage src={item.mediaUrl} alt="피드 이미지" />
            )}
          </div>
        ))}
      </div>

      <HeartAnimation show={showHeart} />

      {/* 카운터 뱃지 (우상단) */}
      <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
        {activeIndex + 1} / {media.length}
      </div>

      {/* 도트 인디케이터 */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
        {media.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-200 ${
              i === activeIndex
                ? "w-2 h-2 bg-white"
                : "w-1.5 h-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

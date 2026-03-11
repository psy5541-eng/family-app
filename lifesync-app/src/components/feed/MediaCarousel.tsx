"use client";

import { useState, useRef, useCallback } from "react";
import type { FeedMedia } from "@/types/db";
import ImageViewer from "./ImageViewer";

type MediaCarouselProps = {
  media: FeedMedia[];
  onDoubleTap?: () => void;
};

function MediaImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 min-h-[200px]">
          <div className="w-8 h-8 border-3 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-auto block transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
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
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const lastTapRef = useRef(0);
  const heartTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // 핀치 감지용
  const pinchDetectedRef = useRef(false);

  const handleTap = useCallback(() => {
    // 핀치 직후면 무시
    if (pinchDetectedRef.current) {
      pinchDetectedRef.current = false;
      return;
    }

    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // 더블탭 감지 → 좋아요
      onDoubleTap?.();
      setShowHeart(true);
      if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
      heartTimerRef.current = setTimeout(() => setShowHeart(false), 800);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [onDoubleTap]);

  // 핀치 시작 감지 → 이미지 뷰어 열기
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        pinchDetectedRef.current = true;
        // 현재 보이는 이미지의 URL 가져오기
        const currentMedia = media[activeIndex];
        if (currentMedia && currentMedia.mediaType !== "video") {
          setViewerSrc(currentMedia.mediaUrl);
        }
      }
    },
    [media, activeIndex]
  );

  if (!media.length) return null;

  // 단일 미디어
  if (media.length === 1) {
    const item = media[0];
    return (
      <>
        <div
          className="relative w-full bg-black"
          onClick={handleTap}
          onTouchStart={handleTouchStart}
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
          <HeartAnimation show={showHeart} />
        </div>
        {viewerSrc && (
          <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className="relative"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
      >
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
      {viewerSrc && (
        <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
      )}
    </>
  );
}

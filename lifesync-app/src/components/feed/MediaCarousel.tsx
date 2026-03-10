"use client";

import { useState } from "react";
import type { FeedMedia } from "@/types/db";

type MediaCarouselProps = {
  media: FeedMedia[];
};

function MediaImage({ src, alt }: { src: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="w-full h-auto block" />;
}

export default function MediaCarousel({ media }: MediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!media.length) return null;

  // 단일 미디어
  if (media.length === 1) {
    const item = media[0];
    return (
      <div className="w-full bg-black">
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
    );
  }

  return (
    <div className="relative">
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

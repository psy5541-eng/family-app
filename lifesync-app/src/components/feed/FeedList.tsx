"use client";

import { useEffect, useRef } from "react";
import FeedCard from "./FeedCard";
import type { FeedWithRelations } from "@/types/db";

type FeedListProps = {
  feeds: FeedWithRelations[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onLikeToggle: (feedId: string) => void;
  onDelete: (feedId: string) => void;
  currentUserId?: string;
};

export default function FeedList({
  feeds,
  isLoading,
  hasMore,
  onLoadMore,
  onLikeToggle,
  onDelete,
  currentUserId,
}: FeedListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver로 무한 스크롤 구현
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMore();
      },
      { rootMargin: "200px" } // 하단 200px 전에 미리 로드
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (!isLoading && feeds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
        </svg>
        <p className="text-base font-medium">아직 게시물이 없습니다</p>
        <p className="text-sm mt-1">첫 번째 게시물을 올려보세요!</p>
      </div>
    );
  }

  return (
    <div>
      {feeds.map((feed) => (
        <FeedCard
          key={feed.id}
          feed={feed}
          onLikeToggle={onLikeToggle}
          onDelete={onDelete}
          currentUserId={currentUserId}
        />
      ))}

      {/* 무한 스크롤 센티넬 */}
      <div ref={sentinelRef} className="h-1" />

      {/* 로딩 스피너 */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 더 이상 피드 없음 */}
      {!hasMore && feeds.length > 0 && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
          모든 게시물을 확인했습니다
        </p>
      )}
    </div>
  );
}

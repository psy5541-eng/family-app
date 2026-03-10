"use client";

import { useState, useCallback } from "react";
import type { FeedWithRelations } from "@/types/db";
import { useAuth } from "@/hooks/useAuth";

type UseFeedReturn = {
  feeds: FeedWithRelations[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  toggleLike: (feedId: string) => Promise<void>;
  deleteFeed: (feedId: string) => Promise<void>;
};

export function useFeed(): UseFeedReturn {
  const { getAuthHeader } = useAuth();
  const [feeds, setFeeds] = useState<FeedWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFeeds = useCallback(async (reset: boolean = false) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const currentCursor = reset ? null : cursor;
      const url = new URL("/api/feed", window.location.origin);
      if (currentCursor) url.searchParams.set("cursor", currentCursor);
      url.searchParams.set("limit", "10");

      const res = await fetch(url.toString(), { headers: getAuthHeader() });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "피드를 불러오는데 실패했습니다.");
        return;
      }

      const { feeds: newFeeds, nextCursor } = json.data;

      setFeeds((prev) => (reset ? newFeeds : [...prev, ...newFeeds]));
      setCursor(nextCursor);
      setHasMore(nextCursor !== null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [cursor, isLoading, getAuthHeader]);

  const loadMore = useCallback(() => fetchFeeds(false), [fetchFeeds]);

  const refresh = useCallback(async () => {
    setCursor(null);
    setHasMore(true);
    await fetchFeeds(true);
  }, [fetchFeeds]);

  // 낙관적 UI: 좋아요 토글
  const toggleLike = useCallback(async (feedId: string) => {
    setFeeds((prev) =>
      prev.map((f) =>
        f.id === feedId
          ? {
              ...f,
              isLiked: !f.isLiked,
              likeCount: f.isLiked ? f.likeCount - 1 : f.likeCount + 1,
            }
          : f
      )
    );

    try {
      const res = await fetch(`/api/feed/${feedId}/like`, {
        method: "POST",
        headers: getAuthHeader(),
      });
      const json = await res.json();

      if (!json.success) {
        setFeeds((prev) =>
          prev.map((f) =>
            f.id === feedId
              ? {
                  ...f,
                  isLiked: !f.isLiked,
                  likeCount: f.isLiked ? f.likeCount - 1 : f.likeCount + 1,
                }
              : f
          )
        );
      }
    } catch {
      setFeeds((prev) =>
        prev.map((f) =>
          f.id === feedId
            ? {
                ...f,
                isLiked: !f.isLiked,
                likeCount: f.isLiked ? f.likeCount - 1 : f.likeCount + 1,
              }
            : f
        )
      );
    }
  }, [getAuthHeader]);

  const deleteFeed = useCallback(async (feedId: string) => {
    setFeeds((prev) => prev.filter((f) => f.id !== feedId));

    try {
      const res = await fetch(`/api/feed/${feedId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      const json = await res.json();

      if (!json.success) {
        await fetchFeeds(true);
      }
    } catch {
      await fetchFeeds(true);
    }
  }, [fetchFeeds, getAuthHeader]);

  return { feeds, isLoading, hasMore, error, loadMore, refresh, toggleLike, deleteFeed };
}

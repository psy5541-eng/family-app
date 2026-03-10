"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import FeedList from "@/components/feed/FeedList";
import CreatePost from "@/components/feed/CreatePost";
import EditPost from "@/components/feed/EditPost";
import { useFeed } from "@/hooks/useFeed";
import { useAuth } from "@/hooks/useAuth";
import type { FeedWithRelations } from "@/types/db";

export default function FeedPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { feeds, isLoading, hasMore, error, loadMore, refresh, toggleLike, deleteFeed, updateFeed } =
    useFeed();
  const [showCreate, setShowCreate] = useState(false);
  const [editingFeed, setEditingFeed] = useState<FeedWithRelations | null>(null);

  // 최초 로드
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FAB에서 ?create=1 파라미터로 진입 시 모달 자동 오픈
  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setShowCreate(true);
      window.history.replaceState(null, "", "/feed");
    }
  }, [searchParams]);

  return (
    <div className="max-w-lg mx-auto">
      {/* 에러 배너 */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 새 게시물 작성 버튼 (상단) */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-full px-4 py-2.5 text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-500">
            나
          </div>
          무슨 일이 있었나요?
        </button>
      </div>

      {/* 피드 목록 */}
      <FeedList
        feeds={feeds}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onLikeToggle={toggleLike}
        onDelete={deleteFeed}
        onEdit={setEditingFeed}
        currentUserId={user?.id}
      />

      {/* 새 게시물 모달 */}
      {showCreate && (
        <CreatePost
          onCreated={() => {
            setShowCreate(false);
            refresh();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* 수정 모달 */}
      {editingFeed && (
        <EditPost
          feed={editingFeed}
          onSave={updateFeed}
          onCancel={() => setEditingFeed(null)}
        />
      )}
    </div>
  );
}

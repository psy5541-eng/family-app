"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/utils/date";
import LikeButton from "./LikeButton";
import MediaCarousel from "./MediaCarousel";
import type { FeedWithRelations } from "@/types/db";
import { useAuth } from "@/hooks/useAuth";

type FeedCardProps = {
  feed: FeedWithRelations;
  onLikeToggle: (feedId: string) => void;
  onDelete?: (feedId: string) => void;
  currentUserId?: string;
};

export default function FeedCard({
  feed,
  onLikeToggle,
  onDelete,
  currentUserId,
}: FeedCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const isOwner = currentUserId === feed.user.id;
  const isLongContent = (feed.content?.length ?? 0) > 100;

  return (
    <article className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
      {/* 상단: 프로필 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          {/* 아바타 */}
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
            {feed.user.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={feed.user.profileImage}
                alt={feed.user.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-bold">
                {feed.user.nickname[0].toUpperCase()}
              </div>
            )}
          </div>
          {/* 닉네임 + 시간 */}
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {feed.user.nickname}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatRelativeTime(feed.createdAt)}
            </p>
          </div>
        </div>

        {/* 삭제 버튼 (본인 게시물만) */}
        {isOwner && onDelete && (
          <button
            onClick={() => onDelete(feed.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="게시물 삭제"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 미디어 캐러셀 */}
      {feed.media.length > 0 && <MediaCarousel media={feed.media} />}

      {/* 하단: 액션 + 텍스트 */}
      <div className="px-4 pb-4">
        {/* 좋아요 / 댓글 버튼 */}
        <div className="flex items-center gap-4 py-2">
          <LikeButton
            feedId={feed.id}
            liked={feed.isLiked ?? false}
            count={feed.likeCount}
            onToggle={onLikeToggle}
          />

          {/* 댓글 버튼 */}
          <button
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 group"
            aria-label="댓글"
          >
            <svg
              className="w-6 h-6 group-hover:stroke-primary-500 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
              />
            </svg>
            <span className="text-sm font-medium">{feed.commentCount}</span>
          </button>
        </div>

        {/* 텍스트 내용 */}
        {feed.content && (
          <div className="text-sm text-gray-800 dark:text-gray-200">
            <span className="font-semibold mr-1">{feed.user.nickname}</span>
            {isLongContent && !showFullContent ? (
              <>
                {feed.content.slice(0, 100)}
                <button
                  onClick={() => setShowFullContent(true)}
                  className="text-gray-500 dark:text-gray-400 ml-1"
                >
                  ... 더 보기
                </button>
              </>
            ) : (
              feed.content
            )}
          </div>
        )}

        {/* 댓글 섹션 */}
        {showComments && (
          <CommentSection feedId={feed.id} commentCount={feed.commentCount} />
        )}
      </div>
    </article>
  );
}

// 인라인 댓글 섹션 컴포넌트
function CommentSection({ feedId, commentCount }: { feedId: string; commentCount: number }) {
  const { getAuthHeader } = useAuth();
  const [comments, setComments] = useState<
    Array<{ id: string; content: string; createdAt: Date; user: { id: string; nickname: string; profileImage: string | null } }>
  >([]);
  const [loaded, setLoaded] = useState(false);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (loaded) return;
    async function loadComments() {
      const res = await fetch(`/api/feed/${feedId}/comments`);
      const json = await res.json();
      if (json.success) setComments(json.data.comments);
      setLoaded(true);
    }
    loadComments();
  }, [feedId, loaded]);

  async function submitComment() {
    if (!newComment.trim()) return;
    const res = await fetch(`/api/feed/${feedId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ content: newComment }),
    });
    const json = await res.json();
    if (json.success) {
      setNewComment("");
      setLoaded(false); // 댓글 재로드
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {commentCount > 0 && !loaded && (
        <p className="text-xs text-gray-500">댓글 {commentCount}개 불러오는 중...</p>
      )}
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2 text-sm">
          <span className="font-semibold text-gray-900 dark:text-white flex-shrink-0">
            {c.user.nickname}
          </span>
          <span className="text-gray-700 dark:text-gray-300">{c.content}</span>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitComment()}
          placeholder="댓글 달기..."
          className="flex-1 text-sm bg-transparent border-b border-gray-200 dark:border-gray-600 pb-1 outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
        />
        <button
          onClick={submitComment}
          disabled={!newComment.trim()}
          className="text-sm font-semibold text-primary-600 disabled:text-gray-400"
        >
          게시
        </button>
      </div>
    </div>
  );
}

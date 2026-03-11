"use client";

import { useEffect, useState, useCallback } from "react";
import { formatRelativeTime } from "@/lib/utils/date";
import LikeButton from "./LikeButton";
import MediaCarousel from "./MediaCarousel";
import type { FeedWithRelations } from "@/types/db";
import { useAuth } from "@/hooks/useAuth";

type FeedCardProps = {
  feed: FeedWithRelations;
  onLikeToggle: (feedId: string) => void;
  onDelete?: (feedId: string) => void;
  onEdit?: (feed: FeedWithRelations) => void;
  currentUserId?: string;
};

export default function FeedCard({
  feed,
  onLikeToggle,
  onDelete,
  onEdit,
  currentUserId,
}: FeedCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = currentUserId === feed.user.id;
  const isLongContent = (feed.content?.length ?? 0) > 100;

  // 더블탭 시 아직 좋아요 안 했으면 좋아요 추가
  const handleDoubleTap = useCallback(() => {
    if (!feed.isLiked) {
      onLikeToggle(feed.id);
    }
  }, [feed.id, feed.isLiked, onLikeToggle]);

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

        {/* 더보기 메뉴 (본인 게시물만) */}
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="더보기"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 z-40 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden min-w-[120px]">
                  {onEdit && (
                    <button
                      onClick={() => { setShowMenu(false); onEdit(feed); }}
                      className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      수정
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => { setShowMenu(false); onDelete(feed.id); }}
                      className="w-full px-4 py-2.5 text-sm text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 미디어 캐러셀 (더블탭 좋아요) */}
      {feed.media.length > 0 && (
        <MediaCarousel media={feed.media} onDoubleTap={handleDoubleTap} />
      )}

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
          <CommentSection feedId={feed.id} commentCount={feed.commentCount} currentUserId={currentUserId} />
        )}
      </div>
    </article>
  );
}

// ============================================================
// 댓글 타입
// ============================================================
type CommentData = {
  id: string;
  content: string;
  createdAt: Date;
  parentId: string | null;
  likeCount: number;
  isLiked: boolean;
  user: { id: string; nickname: string; profileImage: string | null };
  replies?: CommentData[];
};

// ============================================================
// 댓글 섹션 (하트 + 대댓글)
// ============================================================
function CommentSection({
  feedId,
  commentCount,
  currentUserId,
}: {
  feedId: string;
  commentCount: number;
  currentUserId?: string;
}) {
  const { getAuthHeader } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null);

  useEffect(() => {
    if (loaded) return;
    async function loadComments() {
      const res = await fetch(`/api/feed/${feedId}/comments`, { headers: getAuthHeader() });
      const json = await res.json();
      if (json.success) {
        const all: CommentData[] = json.data.comments.map((c: CommentData) => ({
          ...c,
          likeCount: c.likeCount ?? 0,
          isLiked: c.isLiked ?? false,
          parentId: c.parentId ?? null,
        }));
        // 대댓글 그룹화
        const roots: CommentData[] = [];
        const replyMap = new Map<string, CommentData[]>();
        for (const c of all) {
          if (c.parentId) {
            if (!replyMap.has(c.parentId)) replyMap.set(c.parentId, []);
            replyMap.get(c.parentId)!.push(c);
          } else {
            roots.push(c);
          }
        }
        for (const root of roots) {
          root.replies = replyMap.get(root.id) ?? [];
        }
        setComments(roots);
      }
      setLoaded(true);
    }
    loadComments();
  }, [feedId, loaded]);

  async function submitComment() {
    if (!newComment.trim()) return;
    const body: { content: string; parentId?: string } = { content: newComment };
    if (replyTo) body.parentId = replyTo.id;

    const res = await fetch(`/api/feed/${feedId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.success) {
      setNewComment("");
      setReplyTo(null);
      setLoaded(false); // 재로드
    }
  }

  async function toggleCommentLike(commentId: string) {
    // 낙관적 UI
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return { ...c, isLiked: !c.isLiked, likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1 };
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId
                ? { ...r, isLiked: !r.isLiked, likeCount: r.isLiked ? r.likeCount - 1 : r.likeCount + 1 }
                : r
            ),
          };
        }
        return c;
      })
    );

    await fetch(`/api/feed/${feedId}/comments/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ commentId }),
    });
  }

  return (
    <div className="mt-3 space-y-3">
      {commentCount > 0 && !loaded && (
        <p className="text-xs text-gray-500">댓글 {commentCount}개 불러오는 중...</p>
      )}

      {comments.map((c) => (
        <div key={c.id}>
          <CommentItem
            comment={c}
            onReply={() => setReplyTo({ id: c.id, nickname: c.user.nickname })}
            onLike={() => toggleCommentLike(c.id)}
            currentUserId={currentUserId}
          />
          {/* 대댓글 */}
          {c.replies && c.replies.length > 0 && (
            <div className="ml-8 mt-1 space-y-1.5">
              {c.replies.map((r) => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  onReply={() => setReplyTo({ id: c.id, nickname: r.user.nickname })}
                  onLike={() => toggleCommentLike(r.id)}
                  currentUserId={currentUserId}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* 댓글 입력 */}
      <div>
        {replyTo && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs text-primary-500">@{replyTo.nickname}에게 답글</span>
            <button onClick={() => setReplyTo(null)} className="text-xs text-gray-400 ml-1">취소</button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitComment()}
            placeholder={replyTo ? `@${replyTo.nickname}에게 답글 달기...` : "댓글 달기..."}
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
    </div>
  );
}

// ============================================================
// 개별 댓글 아이템
// ============================================================
function CommentItem({
  comment,
  onReply,
  onLike,
  currentUserId,
  isReply,
}: {
  comment: CommentData;
  onReply: () => void;
  onLike: () => void;
  currentUserId?: string;
  isReply?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 group">
      {/* 아바타 */}
      <div className={`${isReply ? "w-6 h-6" : "w-7 h-7"} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0`}>
        {comment.user.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={comment.user.profileImage} alt={comment.user.nickname} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
            {comment.user.nickname[0].toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <span className="font-semibold text-gray-900 dark:text-white mr-1">
            {comment.user.nickname}
          </span>
          <span className="text-gray-700 dark:text-gray-300">{comment.content}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[11px] text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
          {comment.likeCount > 0 && (
            <span className="text-[11px] text-gray-400">좋아요 {comment.likeCount}개</span>
          )}
          <button onClick={onReply} className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            답글 달기
          </button>
        </div>
      </div>

      {/* 하트 버튼 */}
      <button onClick={onLike} className="flex-shrink-0 p-1 mt-1" aria-label="댓글 좋아요">
        <svg
          className={`w-3.5 h-3.5 transition-colors ${
            comment.isLiked
              ? "fill-red-500 stroke-red-500"
              : "fill-transparent stroke-gray-400 hover:stroke-red-400"
          }`}
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
          />
        </svg>
      </button>
    </div>
  );
}

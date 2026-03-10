"use client";

import { useState } from "react";
import type { FeedWithRelations } from "@/types/db";

type EditPostProps = {
  feed: FeedWithRelations;
  onSave: (feedId: string, content: string) => Promise<boolean>;
  onCancel: () => void;
};

export default function EditPost({ feed, onSave, onCancel }: EditPostProps) {
  const [content, setContent] = useState(feed.content ?? "");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    const ok = await onSave(feed.id, content.trim());
    setIsSaving(false);
    if (ok) onCancel();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <button onClick={onCancel} className="text-sm text-gray-600 dark:text-gray-400">
            취소
          </button>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">게시물 수정</h2>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="text-sm font-semibold text-primary-600 disabled:text-gray-400"
          >
            {isSaving ? "저장 중..." : "완료"}
          </button>
        </div>

        {/* 기존 미디어 미리보기 */}
        {feed.media.length > 0 && (
          <div className="flex overflow-x-auto gap-1 p-4 pb-0">
            {feed.media.map((m) => (
              <div key={m.id} className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                {m.mediaType === "video" ? (
                  <video src={m.mediaUrl} className="w-full h-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.mediaUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* 본문 수정 */}
        <div className="p-4 space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            maxLength={2000}
            className="w-full text-sm text-gray-800 dark:text-gray-200 bg-transparent outline-none resize-none placeholder-gray-400"
            autoFocus
          />
          <div className="flex justify-end text-xs text-gray-400">
            {content.length} / 2000
          </div>
        </div>
      </div>
    </div>
  );
}

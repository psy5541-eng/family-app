"use client";

import { useState, useEffect } from "react";
import MediaUploader from "./MediaUploader";
import { useAuth } from "@/hooks/useAuth";
import { registerBackHandler } from "@/hooks/useBackButton";

type CreatePostProps = {
  onCreated: () => void;
  onCancel: () => void;
};

export default function CreatePost({ onCreated, onCancel }: CreatePostProps) {
  const { getAuthHeader } = useAuth();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 뒤로가기 시 모달 닫기
  useEffect(() => registerBackHandler(onCancel), [onCancel]);

  async function handleSubmit() {
    if (!content.trim() && files.length === 0) {
      setError("내용 또는 미디어를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let mediaUrls: Array<{ url: string; type: "image" | "video"; order: number }> = [];

      // 1. 미디어 업로드
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        formData.append("purpose", "feed");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: getAuthHeader(),
          body: formData,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadJson.success) {
          setError(uploadJson.error ?? "업로드 실패");
          return;
        }

        mediaUrls = uploadJson.data.files.map(
          (f: { url: string; type: "image" | "video" }, i: number) => ({
            url: f.url,
            type: f.type,
            order: i,
          })
        );
      }

      // 2. 피드 생성
      const feedRes = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ content: content.trim(), mediaUrls }),
      });

      const feedJson = await feedRes.json();
      if (!feedJson.success) {
        setError(feedJson.error ?? "게시물 작성 실패");
        return;
      }

      onCreated();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            취소
          </button>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">새 게시물</h2>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && files.length === 0)}
            className="text-sm font-semibold text-primary-600 disabled:text-gray-400"
          >
            {isSubmitting ? "게시 중..." : "게시"}
          </button>
        </div>

        {/* 본문 */}
        <div className="p-4 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="무슨 일이 있었나요?"
            rows={4}
            maxLength={2000}
            className="w-full text-sm text-gray-800 dark:text-gray-200 bg-transparent outline-none resize-none placeholder-gray-400"
          />

          <div className="flex justify-end text-xs text-gray-400">
            {content.length} / 2000
          </div>

          <MediaUploader onChange={setFiles} />

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

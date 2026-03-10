"use client";

import { useRef, useState } from "react";
import ImageCropper from "./ImageCropper";

type UploadedPreview = {
  file: File;
  previewUrl: string;
  type: "image" | "video";
};

type MediaUploaderProps = {
  maxImages?: number;
  onChange: (files: File[]) => void;
};

export default function MediaUploader({ maxImages = 10, onChange }: MediaUploaderProps) {
  const [previews, setPreviews] = useState<UploadedPreview[]>([]);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList) {
    const imageFiles = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    const videoFiles = Array.from(fileList).filter((f) => f.type.startsWith("video/"));

    // 영상이 포함된 경우 크롭 없이 바로 추가
    if (videoFiles.length > 0) {
      const video = videoFiles[0];
      const preview: UploadedPreview = {
        file: video,
        previewUrl: URL.createObjectURL(video),
        type: "video",
      };
      setPreviews([preview]);
      onChange([video]);
      return;
    }

    // 이미지 처리: 크롭 큐에 추가
    const remaining = maxImages - previews.length;
    const newFiles = imageFiles.slice(0, remaining);
    if (newFiles.length > 0) {
      setCropQueue(newFiles);
    }
  }

  function handleCropped(croppedFile: File) {
    const preview: UploadedPreview = {
      file: croppedFile,
      previewUrl: URL.createObjectURL(croppedFile),
      type: "image",
    };

    const updated = [...previews, preview];
    setPreviews(updated);
    onChange(updated.map((p) => p.file));

    // 다음 이미지로
    setCropQueue((prev) => prev.slice(1));
  }

  function handleCropCancel() {
    // 현재 이미지 건너뛰기 (원본으로 추가)
    const currentFile = cropQueue[0];
    if (currentFile) {
      const preview: UploadedPreview = {
        file: currentFile,
        previewUrl: URL.createObjectURL(currentFile),
        type: "image",
      };
      const updated = [...previews, preview];
      setPreviews(updated);
      onChange(updated.map((p) => p.file));
    }
    setCropQueue((prev) => prev.slice(1));
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index].previewUrl);
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onChange(updated.map((p) => p.file));
  }

  const hasVideo = previews.some((p) => p.type === "video");
  const canAddMore = !hasVideo && previews.length < maxImages;

  return (
    <div>
      {/* 미리보기 그리드 */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-1 mb-3">
          {previews.map((p, i) => (
            <div key={i} className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              {p.type === "video" ? (
                <video src={p.previewUrl} className="w-full h-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.previewUrl} alt="미리보기" className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 업로드 버튼 */}
      {canAddMore && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 w-full hover:border-primary-400 hover:text-primary-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          사진/동영상 추가 ({previews.length}/{maxImages})
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = ""; // 같은 파일 다시 선택 가능
        }}
      />

      {/* 이미지 크롭 모달 */}
      {cropQueue.length > 0 && (
        <ImageCropper
          file={cropQueue[0]}
          onCropped={handleCropped}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}

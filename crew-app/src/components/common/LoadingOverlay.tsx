"use client";

type LoadingOverlayProps = {
  visible: boolean;
  message?: string;
};

export default function LoadingOverlay({ visible, message = "처리 중..." }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-xl">
        <div className="w-10 h-10 border-[3px] border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{message}</p>
      </div>
    </div>
  );
}

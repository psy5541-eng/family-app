"use client";

type LikeButtonProps = {
  feedId: string;
  liked: boolean;
  count: number;
  onToggle: (feedId: string) => void;
};

export default function LikeButton({ feedId, liked, count, onToggle }: LikeButtonProps) {
  return (
    <button
      onClick={() => onToggle(feedId)}
      className="flex items-center gap-1.5 group"
      aria-label={liked ? "좋아요 취소" : "좋아요"}
    >
      <svg
        className={`w-6 h-6 transition-all duration-200 ${
          liked
            ? "fill-red-500 stroke-red-500 scale-110"
            : "fill-transparent stroke-gray-700 dark:stroke-gray-300 group-hover:stroke-red-400"
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
      <span
        className={`text-sm font-medium ${
          liked ? "text-red-500" : "text-gray-600 dark:text-gray-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

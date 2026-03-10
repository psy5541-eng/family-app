"use client";

import { useEffect, useState, useCallback } from "react";

type NewsItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
};

export default function NewsWidget() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      const json = await res.json();
      if (json.success) setNews(json.data.news);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm space-y-3 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-1.5 mb-3">
        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z" />
        </svg>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">주요 뉴스</h3>
      </div>

      {news.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-2">뉴스 없음</p>
      ) : (
        <div className="space-y-3">
          {news.map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {item.title}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                {item.description}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

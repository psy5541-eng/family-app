"use client";

import { useEffect, useState, useCallback } from "react";

type StockItem = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  type: "stock" | "index";
};

// 한국 장 운영 시간: 월~금 09:00~15:30 KST
function isMarketOpen(): boolean {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const day = kst.getUTCDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const h = kst.getUTCHours();
  const m = kst.getUTCMinutes();
  const totalMin = h * 60 + m;
  return totalMin >= 9 * 60 && totalMin < 15 * 60 + 30;
}

function formatPrice(price: number, currency: string) {
  if (currency === "KRW") {
    return price >= 1000
      ? price.toLocaleString("ko-KR")
      : price.toFixed(2);
  }
  return "$" + price.toFixed(2);
}

export default function StockWidget() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/stock?includeIndex=true");
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items);
        setUpdatedAt(json.data.updatedAt);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    // 장 운영 중에는 5분마다 자동 갱신
    const interval = setInterval(() => {
      if (isMarketOpen()) load();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [load]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm space-y-3 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const updatedTime = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    : null;

  const indices = items.filter((i) => i.type === "index");
  const stocks = items.filter((i) => i.type === "stock");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">증시</h3>
        </div>
        <div className="flex items-center gap-2">
          {isMarketOpen() && (
            <span className="flex items-center gap-1 text-[10px] text-green-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              장중
            </span>
          )}
          {updatedTime && (
            <span className="text-[10px] text-gray-400">{updatedTime}</span>
          )}
          <button
            onClick={load}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="새로고침"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-2">데이터 없음</p>
      ) : (
        <>
          {/* KOSPI/KOSDAQ 지수 */}
          {indices.length > 0 && (
            <div className="flex gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
              {indices.map((item) => {
                const isUp = item.change > 0;
                const isDown = item.change < 0;
                return (
                  <div key={item.symbol} className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{item.name}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                      {item.price.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-[11px] font-medium ${isUp ? "text-red-500" : isDown ? "text-blue-500" : "text-gray-400"}`}>
                      {isUp ? "▲" : isDown ? "▼" : "─"} {Math.abs(item.changePercent).toFixed(2)}%
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* 개별 종목 */}
          <div className="space-y-2.5">
            {stocks.map((item) => {
              const isUp = item.change > 0;
              const isDown = item.change < 0;
              return (
                <div key={item.symbol} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-[11px] text-gray-400">{item.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatPrice(item.price, item.currency)}
                    </p>
                    <p className={`text-xs font-medium ${isUp ? "text-red-500" : isDown ? "text-blue-500" : "text-gray-400"}`}>
                      {isUp ? "▲" : isDown ? "▼" : "─"} {Math.abs(item.changePercent).toFixed(2)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

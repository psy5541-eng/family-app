"use client";

import WeatherWidget from "@/components/dashboard/WeatherWidget";
import StockWidget from "@/components/dashboard/StockWidget";
import DdayWidget from "@/components/dashboard/DdayWidget";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  const hour = new Date().getHours();
  const greeting =
    hour < 6  ? "새벽이네요" :
    hour < 12 ? "좋은 아침이에요" :
    hour < 18 ? "즐거운 오후에요" :
                "좋은 저녁이에요";

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* 인사말 */}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{greeting}</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {user?.nickname ?? ""}님의 하루
        </h2>
      </div>

      {/* 날씨 위젯 */}
      <WeatherWidget />

      {/* 증시 + D-day */}
      <div className="grid grid-cols-1 fold-open:grid-cols-2 gap-4">
        <StockWidget />
        <DdayWidget />
      </div>
    </div>
  );
}

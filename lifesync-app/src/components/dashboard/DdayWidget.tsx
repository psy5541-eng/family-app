"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { calcDday } from "@/lib/utils/date";
import type { CalendarEvent } from "@/types/db";

export default function DdayWidget() {
  const { getAuthHeader } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/calendar/dday", { headers: getAuthHeader() });
        const json = await res.json();
        if (json.success) {
          setEvents(
            json.data.events.map((e: CalendarEvent) => ({
              ...e,
              startDate: new Date(e.startDate),
            }))
          );
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3" />
        <div className="flex gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex-1 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center gap-1.5 mb-3">
        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">D-day</h3>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">D-day 일정이 없습니다</p>
          <p className="text-xs text-gray-300 dark:text-gray-500 mt-1">캘린더에서 D-day를 설정해보세요</p>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {events.map((event) => {
            const dday = calcDday(event.startDate);
            const isPast = dday.startsWith("D+");
            const isToday = dday === "D-day";

            return (
              <div
                key={event.id}
                className={`flex-shrink-0 min-w-[100px] rounded-xl p-3 text-center ${
                  isToday
                    ? "bg-red-500 text-white"
                    : isPast
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    : "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                }`}
              >
                <p
                  className={`text-xl font-bold leading-none ${
                    isToday ? "text-white" : isPast ? "text-gray-400" : "text-primary-600 dark:text-primary-400"
                  }`}
                >
                  {dday}
                </p>
                <p
                  className={`text-xs mt-1.5 font-medium truncate max-w-[90px] mx-auto ${
                    isToday ? "text-white/90" : "text-current opacity-80"
                  }`}
                >
                  {event.title}
                </p>
                <p
                  className={`text-[10px] mt-0.5 ${
                    isToday ? "text-white/70" : "opacity-50"
                  }`}
                >
                  {(event.startDate instanceof Date ? event.startDate : new Date(event.startDate))
                    .toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

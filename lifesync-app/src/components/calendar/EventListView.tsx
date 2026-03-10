"use client";

import type { CalendarEvent } from "@/types/db";
import { calcDday, formatEventDate } from "@/lib/utils/date";

type EventListViewProps = {
  events: CalendarEvent[];
  year: number;
  month: number;
  onEventClick: (event: CalendarEvent) => void;
};

// 이벤트 색상 (일정별 고유 색상)
const EVENT_COLORS = [
  "bg-primary-400",
  "bg-rose-400",
  "bg-amber-400",
  "bg-emerald-400",
  "bg-violet-400",
  "bg-sky-400",
  "bg-orange-400",
  "bg-teal-400",
];

function getEventColor(eventId: string): string {
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    hash = ((hash << 5) - hash + eventId.charCodeAt(i)) | 0;
  }
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

function groupByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  const sorted = [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  for (const event of sorted) {
    const d = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(event);
  }
  return map;
}

export default function EventListView({ events, year, month, onEventClick }: EventListViewProps) {
  const grouped = groupByDate(events);

  if (events.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
          />
        </svg>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          이번 달은 일정이 없어요
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          새로운 추억을 만들어보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50 dark:divide-gray-700/50">
      {Array.from(grouped.entries()).map(([dateKey, dayEvents]) => {
        const date = new Date(dateKey);
        const dayLabel = date.toLocaleDateString("ko-KR", {
          month: "short",
          day: "numeric",
          weekday: "short",
        });
        const isToday =
          date.getFullYear() === new Date().getFullYear() &&
          date.getMonth() === new Date().getMonth() &&
          date.getDate() === new Date().getDate();

        return (
          <div key={dateKey} className="px-4 py-3">
            {/* 날짜 헤더 */}
            <div className="flex items-center gap-2 mb-2">
              {isToday && (
                <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
              )}
              <p
                className={`text-xs font-semibold ${
                  isToday
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {dayLabel}
              </p>
            </div>

            {/* 일정 목록 */}
            <div className="space-y-1.5 pl-1">
              {dayEvents.map((event) => {
                const color = getEventColor(event.id);
                return (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="w-full flex items-start gap-2.5 text-left py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors -mx-1 px-1"
                  >
                    {/* 색상 바 */}
                    <div className={`w-1 min-h-[2rem] rounded-full ${color} flex-shrink-0 mt-0.5`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {event.title}
                        </p>
                        {event.isDday && (
                          <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded flex-shrink-0">
                            {calcDday(event.startDate)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {event.isAllDay
                          ? "종일"
                          : formatEventDate(event.startDate) +
                            (event.endDate ? ` ~ ${formatEventDate(event.endDate)}` : "")}
                      </p>
                      {event.placeName && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                          {event.placeName}
                        </p>
                      )}
                    </div>

                    <svg
                      className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

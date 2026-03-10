"use client";

import type { CalendarEvent } from "@/types/db";
import { calcDday } from "@/lib/utils/date";

type CalendarGridProps = {
  year: number;
  month: number;
  events: CalendarEvent[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarGrid({
  year,
  month,
  events,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  const today = new Date();

  // 달력 날짜 배열 생성 (앞뒤 빈 칸 포함)
  const firstDay = new Date(year, month - 1, 1).getDay(); // 요일 (0=일)
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month - 1, i + 1)),
  ];

  // 6주 격자를 채울 빈칸 추가
  while (cells.length % 7 !== 0) cells.push(null);

  function getEventDots(date: Date): CalendarEvent[] {
    return events.filter((e) => {
      const d = e.startDate instanceof Date ? e.startDate : new Date(e.startDate);
      return isSameDay(d, date);
    });
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`py-2 text-center text-xs font-medium ${
              i === 0
                ? "text-red-500"
                : i === 6
                ? "text-blue-500"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 격자 */}
      <div className="grid grid-cols-7">
        {cells.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="h-14" />;
          }

          const dots = getEventDots(date);
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const dayOfWeek = date.getDay();
          const hasDday = dots.some((e) => e.isDday);

          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelectDate(date)}
              className={`relative h-14 flex flex-col items-center justify-start pt-1.5 gap-0.5 transition-colors
                ${isSelected ? "bg-primary-50 dark:bg-primary-900/30" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}
              `}
            >
              {/* 날짜 숫자 */}
              <span
                className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                  ${isToday ? "bg-primary-500 text-white font-bold" : ""}
                  ${!isToday && dayOfWeek === 0 ? "text-red-500" : ""}
                  ${!isToday && dayOfWeek === 6 ? "text-blue-500" : ""}
                  ${!isToday && dayOfWeek > 0 && dayOfWeek < 6 ? "text-gray-800 dark:text-gray-200" : ""}
                `}
              >
                {date.getDate()}
              </span>

              {/* D-day 뱃지 또는 이벤트 도트 */}
              {hasDday ? (
                <span className="text-[9px] font-bold text-primary-500 leading-none">
                  {calcDday(dots.find((e) => e.isDday)!.startDate)}
                </span>
              ) : dots.length > 0 ? (
                <div className="flex gap-0.5">
                  {dots.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className="w-1 h-1 rounded-full bg-primary-400"
                    />
                  ))}
                  {dots.length > 3 && (
                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                  )}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

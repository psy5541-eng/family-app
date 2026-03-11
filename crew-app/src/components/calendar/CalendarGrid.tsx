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

const COLOR_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  primary: { bg: "bg-primary-200 dark:bg-primary-800/60", text: "text-primary-700 dark:text-primary-300", dot: "bg-primary-400" },
  rose: { bg: "bg-rose-200 dark:bg-rose-800/60", text: "text-rose-700 dark:text-rose-300", dot: "bg-rose-400" },
  amber: { bg: "bg-amber-200 dark:bg-amber-800/60", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-400" },
  emerald: { bg: "bg-emerald-200 dark:bg-emerald-800/60", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-400" },
  violet: { bg: "bg-violet-200 dark:bg-violet-800/60", text: "text-violet-700 dark:text-violet-300", dot: "bg-violet-400" },
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

function getEventColor(event: CalendarEvent) {
  const colorKey = (event as CalendarEvent & { color?: string }).color ?? "primary";
  return COLOR_MAP[colorKey] ?? COLOR_MAP.primary;
}

// 기간 일정인지 (endDate가 있고 startDate와 다른 날)
function isMultiDay(event: CalendarEvent): boolean {
  if (!event.endDate) return false;
  const s = toDate(event.startDate);
  const e = toDate(event.endDate);
  return !isSameDay(s, e);
}

type BarSegment = {
  event: CalendarEvent;
  startCol: number; // 0-6
  endCol: number; // 0-6 (inclusive)
  slot: number;
  isStart: boolean;
  isEnd: boolean;
};

function computeBarsForWeek(
  weekCells: (Date | null)[],
  multiDayEvents: CalendarEvent[]
): BarSegment[] {
  const segments: BarSegment[] = [];
  const slotMap: Map<string, number> = new Map(); // eventId -> slot (for consistency across weeks)

  // 이벤트를 startDate 기준으로 정렬
  const sorted = [...multiDayEvents].sort(
    (a, b) => toDate(a.startDate).getTime() - toDate(b.startDate).getTime()
  );

  for (const event of sorted) {
    const eStart = toDate(event.startDate);
    const eEnd = toDate(event.endDate!);

    let startCol = -1;
    let endCol = -1;

    for (let col = 0; col < 7; col++) {
      const cell = weekCells[col];
      if (!cell) continue;
      const cellTime = cell.getTime();
      const startDay = new Date(eStart.getFullYear(), eStart.getMonth(), eStart.getDate()).getTime();
      const endDay = new Date(eEnd.getFullYear(), eEnd.getMonth(), eEnd.getDate()).getTime();

      if (cellTime >= startDay && cellTime <= endDay) {
        if (startCol === -1) startCol = col;
        endCol = col;
      }
    }

    if (startCol === -1) continue;

    const isStart = weekCells[startCol] !== null && isSameDay(weekCells[startCol]!, eStart);
    const isEnd = weekCells[endCol] !== null && isSameDay(weekCells[endCol]!, eEnd);

    segments.push({ event, startCol, endCol, slot: 0, isStart, isEnd });
  }

  // Slot 배정 (겹침 처리)
  const usedSlots: number[][] = Array.from({ length: 7 }, () => []);

  for (const seg of segments) {
    let slot = 0;
    // 이 세그먼트가 차지하는 모든 열에서 사용 가능한 최소 slot 찾기
    while (true) {
      let available = true;
      for (let col = seg.startCol; col <= seg.endCol; col++) {
        if (usedSlots[col].includes(slot)) {
          available = false;
          break;
        }
      }
      if (available) break;
      slot++;
    }

    seg.slot = slot;
    for (let col = seg.startCol; col <= seg.endCol; col++) {
      usedSlots[col].push(slot);
    }
  }

  return segments;
}

export default function CalendarGrid({
  year,
  month,
  events,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  const today = new Date();

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month - 1, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const multiDayEvents = events.filter(isMultiDay);
  const singleDayEvents = events.filter((e) => !isMultiDay(e));

  function getSingleDayDots(date: Date): CalendarEvent[] {
    return singleDayEvents.filter((e) => isSameDay(toDate(e.startDate), date));
  }

  // 주 단위 렌더
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`py-2 text-center text-xs font-medium ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 주 단위 렌더 */}
      {weeks.map((weekCells, weekIdx) => {
        const bars = computeBarsForWeek(weekCells, multiDayEvents);
        const maxSlot = bars.length > 0 ? Math.max(...bars.map((b) => b.slot)) : -1;
        const barAreaHeight = maxSlot >= 0 ? (maxSlot + 1) * 18 : 0;

        return (
          <div key={weekIdx} className="relative">
            {/* 날짜 셀 */}
            <div className="grid grid-cols-7">
              {weekCells.map((date, colIdx) => {
                if (!date) {
                  return <div key={`e-${weekIdx}-${colIdx}`} className="h-14" />;
                }

                const dots = getSingleDayDots(date);
                const isToday = isSameDay(date, today);
                const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                const dayOfWeek = date.getDay();
                const hasDday = dots.some((e) => e.isDday);

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => onSelectDate(date)}
                    className={`relative flex flex-col items-center justify-start pt-1.5 gap-0.5 transition-colors
                      ${isSelected ? "bg-primary-50 dark:bg-primary-900/30" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}
                    `}
                    style={{ height: `${56 + barAreaHeight}px` }}
                  >
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

                    {hasDday ? (
                      <span className="text-[9px] font-bold text-primary-500 leading-none">
                        {calcDday(dots.find((e) => e.isDday)!.startDate)}
                      </span>
                    ) : dots.length > 0 ? (
                      <div className="flex gap-0.5">
                        {dots.slice(0, 3).map((e) => (
                          <div key={e.id} className={`w-1 h-1 rounded-full ${getEventColor(e).dot}`} />
                        ))}
                        {dots.length > 3 && <div className="w-1 h-1 rounded-full bg-gray-400" />}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* C7: From-To 색상 바 오버레이 */}
            {bars.map((bar) => {
              const color = getEventColor(bar.event);
              const left = `${(bar.startCol / 7) * 100}%`;
              const width = `${((bar.endCol - bar.startCol + 1) / 7) * 100}%`;
              const top = 36 + bar.slot * 18;

              return (
                <div
                  key={`${bar.event.id}-${weekIdx}`}
                  className={`absolute h-4 ${color.bg} flex items-center overflow-hidden pointer-events-none
                    ${bar.isStart ? "rounded-l-full ml-0.5" : ""}
                    ${bar.isEnd ? "rounded-r-full mr-0.5" : ""}
                    ${!bar.isStart && !bar.isEnd ? "" : ""}
                  `}
                  style={{ left, width, top: `${top}px` }}
                >
                  {bar.isStart && (
                    <span className={`text-[9px] font-medium ${color.text} truncate px-1.5 leading-none`}>
                      {bar.event.title}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

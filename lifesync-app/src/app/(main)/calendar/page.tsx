"use client";

import { useEffect, useState } from "react";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import EventModal from "@/components/calendar/EventModal";
import { useCalendar } from "@/hooks/useCalendar";
import type { CalendarEvent } from "@/types/db";
import { calcDday, formatEventDate } from "@/lib/utils/date";

export default function CalendarPage() {
  const {
    events,
    isLoading,
    currentYear,
    currentMonth,
    selectedDate,
    setSelectedDate,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
  } = useCalendar();

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    loadEvents(currentYear, currentMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear, currentMonth]);

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const monthName = new Date(currentYear, currentMonth - 1).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  function openCreate() {
    setEditingEvent(null);
    setShowModal(true);
  }

  function openEdit(event: CalendarEvent) {
    setEditingEvent(event);
    setShowModal(true);
  }

  async function handleSave(data: Parameters<typeof createEvent>[0]) {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
    } else {
      await createEvent(data);
    }
    setShowModal(false);
  }

  async function handleDelete() {
    if (!editingEvent) return;
    await deleteEvent(editingEvent.id);
    setShowModal(false);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="이전 달"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="text-xs text-primary-600 font-medium border border-primary-200 dark:border-primary-700 px-2 py-0.5 rounded-full"
          >
            오늘
          </button>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{monthName}</h2>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="다음 달"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* 캘린더 격자 */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <CalendarGrid
          year={currentYear}
          month={currentMonth}
          events={events}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}

      {/* 선택된 날짜 일정 목록 */}
      {selectedDate && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {selectedDate.toLocaleDateString("ko-KR", {
                month: "long",
                day: "numeric",
                weekday: "short",
              })}
            </h3>
            <button
              onClick={openCreate}
              className="flex items-center gap-1 text-xs text-primary-600 font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              일정 추가
            </button>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <p className="text-sm">일정이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => openEdit(event)}
                  className="w-full text-left bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {event.title}
                        </p>
                        {event.isDday && (
                          <span className="text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-md flex-shrink-0">
                            {calcDday(event.startDate)}
                          </span>
                        )}
                      </div>
                      {event.isAllDay ? (
                        <p className="text-xs text-primary-500 mt-0.5">종일</p>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatEventDate(event.startDate)}
                          {event.endDate && ` ~ ${formatEventDate(event.endDate)}`}
                        </p>
                      )}
                      {event.placeName && (
                        <div className="flex items-center gap-1 mt-1">
                          <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                          <p className="text-xs text-gray-400 truncate">{event.placeName}</p>
                        </div>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FAB: 일정 추가 */}
      <button
        onClick={openCreate}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 active:scale-95 transition-all z-30"
        aria-label="일정 추가"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {/* 일정 생성/수정 모달 */}
      {showModal && selectedDate && (
        <EventModal
          date={selectedDate}
          event={editingEvent}
          onSave={handleSave}
          onDelete={editingEvent ? handleDelete : undefined}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

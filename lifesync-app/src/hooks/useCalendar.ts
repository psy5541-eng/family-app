"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { CalendarEvent } from "@/types/db";

type UseCalendarReturn = {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  currentYear: number;
  currentMonth: number;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  loadEvents: (year?: number, month?: number) => Promise<void>;
  createEvent: (data: EventFormData) => Promise<CalendarEvent | null>;
  updateEvent: (id: string, data: Partial<EventFormData>) => Promise<CalendarEvent | null>;
  deleteEvent: (id: string) => Promise<boolean>;
  getEventsForDate: (date: Date) => CalendarEvent[];
  getDdayEvents: () => CalendarEvent[];
};

export type EventFormData = {
  title: string;
  description?: string;
  startDate: string;  // ISO string
  endDate?: string;
  isAllDay?: boolean;
  isDday?: boolean;
  placeName?: string;
  placeAddress?: string;
  latitude?: string;
  longitude?: string;
  naverPlaceId?: string;
  notifyBefore?: number;
};

export function useCalendar(): UseCalendarReturn {
  const { getAuthHeader } = useAuth();
  const today = new Date();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);

  const loadEvents = useCallback(async (year?: number, month?: number) => {
    const y = year ?? currentYear;
    const m = month ?? currentMonth;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/calendar?year=${y}&month=${m}`, {
        headers: getAuthHeader(),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "일정을 불러오지 못했습니다.");
        return;
      }

      // Date 역직렬화
      const parsed: CalendarEvent[] = json.data.events.map((e: CalendarEvent) => ({
        ...e,
        startDate: new Date(e.startDate),
        endDate: e.endDate ? new Date(e.endDate) : null,
        createdAt: new Date(e.createdAt),
        updatedAt: new Date(e.updatedAt),
      }));
      setEvents(parsed);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth, getAuthHeader]);

  const goToPrevMonth = useCallback(() => {
    setCurrentYear((y) => (currentMonth === 1 ? y - 1 : y));
    setCurrentMonth((m) => (m === 1 ? 12 : m - 1));
    setSelectedDate(null);
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    setCurrentYear((y) => (currentMonth === 12 ? y + 1 : y));
    setCurrentMonth((m) => (m === 12 ? 1 : m + 1));
    setSelectedDate(null);
  }, [currentMonth]);

  const goToToday = useCallback(() => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    setSelectedDate(today);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createEvent = useCallback(async (data: EventFormData): Promise<CalendarEvent | null> => {
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) return null;

      const event: CalendarEvent = {
        ...json.data.event,
        startDate: new Date(json.data.event.startDate),
        endDate: json.data.event.endDate ? new Date(json.data.event.endDate) : null,
        createdAt: new Date(json.data.event.createdAt),
        updatedAt: new Date(json.data.event.updatedAt),
      };
      setEvents((prev) => [...prev, event].sort((a, b) => a.startDate.getTime() - b.startDate.getTime()));
      return event;
    } catch {
      return null;
    }
  }, [getAuthHeader]);

  const updateEvent = useCallback(async (id: string, data: Partial<EventFormData>): Promise<CalendarEvent | null> => {
    try {
      const res = await fetch(`/api/calendar/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) return null;

      const updated: CalendarEvent = {
        ...json.data.event,
        startDate: new Date(json.data.event.startDate),
        endDate: json.data.event.endDate ? new Date(json.data.event.endDate) : null,
        createdAt: new Date(json.data.event.createdAt),
        updatedAt: new Date(json.data.event.updatedAt),
      };
      setEvents((prev) => prev.map((e) => e.id === id ? updated : e));
      return updated;
    } catch {
      return null;
    }
  }, [getAuthHeader]);

  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    // 낙관적 제거
    setEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      const res = await fetch(`/api/calendar/${id}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      const json = await res.json();
      if (!json.success) {
        // 롤백: 재로드
        await loadEvents();
        return false;
      }
      return true;
    } catch {
      await loadEvents();
      return false;
    }
  }, [getAuthHeader, loadEvents]);

  const getEventsForDate = useCallback((date: Date): CalendarEvent[] => {
    return events.filter((e) => {
      const d = e.startDate instanceof Date ? e.startDate : new Date(e.startDate);
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    });
  }, [events]);

  const getDdayEvents = useCallback((): CalendarEvent[] => {
    return events.filter((e) => e.isDday);
  }, [events]);

  return {
    events,
    isLoading,
    error,
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
    getDdayEvents,
  };
}

"use client";

import { useEffect, useRef } from "react";
import type { CalendarEvent } from "@/types/db";

const NOTIFIED_KEY = "lifesync_notified_events";

function getNotifiedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function markNotified(eventId: string, minutesBefore: number) {
  const set = getNotifiedSet();
  set.add(`${eventId}_${minutesBefore}`);
  // 최대 200개만 유지
  const arr = [...set];
  if (arr.length > 200) arr.splice(0, arr.length - 200);
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(arr));
}

function isAlreadyNotified(eventId: string, minutesBefore: number): boolean {
  return getNotifiedSet().has(`${eventId}_${minutesBefore}`);
}

function showNotification(title: string, body: string) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/icons/icon-192x192.png" });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") {
        new Notification(title, { body, icon: "/icons/icon-192x192.png" });
      }
    });
  }
}

function getNotifyLabel(minutes: number): string {
  if (minutes === 0) return "지금";
  if (minutes < 60) return `${minutes}분 후`;
  if (minutes === 60) return "1시간 후";
  if (minutes === 1440) return "내일";
  return `${minutes}분 후`;
}

export function useEventNotifications(events: CalendarEvent[]) {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // 이전 타이머 정리
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const now = Date.now();

    for (const event of events) {
      if (!event.notifyBefore && event.notifyBefore !== 0) continue;
      const minutesBefore = event.notifyBefore as number;

      const startTime = (event.startDate instanceof Date ? event.startDate : new Date(event.startDate)).getTime();
      const notifyAt = startTime - minutesBefore * 60 * 1000;
      const delay = notifyAt - now;

      // 이미 지났거나 24시간 이상 먼 일정은 무시
      if (delay < -60000 || delay > 86400000) continue;

      // 이미 알림한 이벤트 스킵
      if (isAlreadyNotified(event.id, minutesBefore)) continue;

      if (delay <= 0) {
        // 알림 시간이 방금 지남 (1분 이내) → 즉시 알림
        markNotified(event.id, minutesBefore);
        showNotification(
          `📅 ${event.title}`,
          `${getNotifyLabel(minutesBefore)} 시작되는 일정입니다.`
        );
      } else {
        // 미래 알림 예약
        const timer = setTimeout(() => {
          if (!isAlreadyNotified(event.id, minutesBefore)) {
            markNotified(event.id, minutesBefore);
            showNotification(
              `📅 ${event.title}`,
              `${getNotifyLabel(minutesBefore)} 시작되는 일정입니다.`
            );
          }
        }, delay);
        timersRef.current.push(timer);
      }
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [events]);
}

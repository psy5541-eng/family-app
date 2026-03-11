"use client";

import { useEffect, useRef } from "react";
import type { CalendarEvent } from "@/types/db";

function getNotifyLabel(minutes: number): string {
  if (minutes === 0) return "지금";
  if (minutes < 60) return `${minutes}분 후`;
  if (minutes === 60) return "1시간 후";
  if (minutes === 1440) return "내일";
  return `${minutes}분 후`;
}

async function scheduleLocalNotifications(events: CalendarEvent[]) {
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");

    // 권한 요청
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") return;

    // 기존 예약 알림 전부 취소 후 재등록
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }

    const now = Date.now();
    const notifications: {
      id: number;
      title: string;
      body: string;
      schedule: { at: Date; allowWhileIdle: boolean };
      smallIcon?: string;
    }[] = [];

    for (const event of events) {
      if (!event.notifyBefore && event.notifyBefore !== 0) continue;
      const minutesBefore = event.notifyBefore as number;

      const startTime = (event.startDate instanceof Date ? event.startDate : new Date(event.startDate)).getTime();
      const notifyAt = startTime - minutesBefore * 60 * 1000;

      // 이미 지났거나 7일 이상 먼 일정은 무시
      if (notifyAt <= now || notifyAt - now > 7 * 86400000) continue;

      // id는 고유해야 함 - eventId 해시 + minutesBefore
      const id = hashCode(`${event.id}_${minutesBefore}`);

      notifications.push({
        id,
        title: `📅 ${event.title}`,
        body: `${getNotifyLabel(minutesBefore)} 시작되는 일정입니다.`,
        schedule: { at: new Date(notifyAt), allowWhileIdle: true },
        smallIcon: "ic_notification",
      });
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch {
    // Capacitor 플러그인 없는 환경 (웹 브라우저) → 웹 알림 fallback
    scheduleWebNotifications(events);
  }
}

function scheduleWebNotifications(events: CalendarEvent[]) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
  if (Notification.permission !== "granted") return;

  const now = Date.now();

  for (const event of events) {
    if (!event.notifyBefore && event.notifyBefore !== 0) continue;
    const minutesBefore = event.notifyBefore as number;

    const startTime = (event.startDate instanceof Date ? event.startDate : new Date(event.startDate)).getTime();
    const notifyAt = startTime - minutesBefore * 60 * 1000;
    const delay = notifyAt - now;

    // 이미 지났거나 24시간 이상 먼 일정은 무시
    if (delay < -60000 || delay > 86400000) continue;

    if (delay <= 0) {
      new Notification(`📅 ${event.title}`, {
        body: `${getNotifyLabel(minutesBefore)} 시작되는 일정입니다.`,
      });
    } else {
      setTimeout(() => {
        new Notification(`📅 ${event.title}`, {
          body: `${getNotifyLabel(minutesBefore)} 시작되는 일정입니다.`,
        });
      }, delay);
    }
  }
}

/** 문자열 → 양수 정수 해시 (알림 ID용) */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2147483647 || 1;
}

export function useEventNotifications(events: CalendarEvent[]) {
  const prevEventsRef = useRef<string>("");

  useEffect(() => {
    // 이벤트가 동일하면 재스케줄 방지
    const key = events
      .filter((e) => e.notifyBefore !== null && e.notifyBefore !== undefined)
      .map((e) => `${e.id}_${e.notifyBefore}_${e.startDate}`)
      .join("|");

    if (key === prevEventsRef.current) return;
    prevEventsRef.current = key;

    scheduleLocalNotifications(events);
  }, [events]);
}

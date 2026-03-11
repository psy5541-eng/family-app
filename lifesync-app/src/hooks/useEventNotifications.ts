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
  // Capacitor 환경 체크
  if (typeof window === "undefined" || !(window as unknown as Record<string, unknown>).Capacitor) {
    console.log("[알림] Capacitor 환경 아님 → 웹 fallback");
    scheduleWebNotifications(events);
    return;
  }

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");

    // 알림 채널 생성 (Android 8+)
    try {
      await LocalNotifications.createChannel({
        id: "calendar_events",
        name: "일정 알림",
        description: "캘린더 일정 알림",
        importance: 5, // MAX
        visibility: 1, // PUBLIC
        vibration: true,
        sound: "default",
      });
    } catch {
      // 채널 이미 존재하거나 iOS인 경우
    }

    // 권한 요청
    const perm = await LocalNotifications.requestPermissions();
    console.log("[알림] 권한 상태:", perm.display);
    if (perm.display !== "granted") {
      console.log("[알림] 권한 거부됨");
      return;
    }

    // 기존 예약 알림 전부 취소 후 재등록
    const pending = await LocalNotifications.getPending();
    console.log("[알림] 기존 예약:", pending.notifications.length, "건");
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }

    const now = Date.now();
    const notifications: {
      id: number;
      title: string;
      body: string;
      channelId: string;
      schedule: { at: Date; allowWhileIdle: boolean };
    }[] = [];

    for (const event of events) {
      if (!event.notifyBefore && event.notifyBefore !== 0) continue;
      const minutesBefore = event.notifyBefore as number;

      const startTime = (event.startDate instanceof Date ? event.startDate : new Date(event.startDate)).getTime();
      const notifyAt = startTime - minutesBefore * 60 * 1000;

      // 이미 지났거나 7일 이상 먼 일정은 무시
      if (notifyAt <= now || notifyAt - now > 7 * 86400000) continue;

      const id = hashCode(`${event.id}_${minutesBefore}`);

      notifications.push({
        id,
        title: `📅 ${event.title}`,
        body: `${getNotifyLabel(minutesBefore)} 시작되는 일정입니다.`,
        channelId: "calendar_events",
        schedule: { at: new Date(notifyAt), allowWhileIdle: true },
      });
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
      console.log("[알림] 스케줄 완료:", notifications.length, "건");
      notifications.forEach((n) => {
        console.log(`  - "${n.title}" @ ${n.schedule.at.toLocaleString()}`);
      });
    } else {
      console.log("[알림] 스케줄할 알림 없음");
    }

    // 확인: 현재 예약된 알림
    const afterPending = await LocalNotifications.getPending();
    console.log("[알림] 현재 예약된 알림:", afterPending.notifications.length, "건");
  } catch (err) {
    console.error("[알림] LocalNotifications 오류:", err);
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
  const listenerSetRef = useRef(false);

  // 알림 클릭 리스너 (한 번만 등록)
  useEffect(() => {
    if (listenerSetRef.current) return;
    listenerSetRef.current = true;

    if (typeof window === "undefined" || !(window as unknown as Record<string, unknown>).Capacitor) return;

    import("@capacitor/local-notifications").then(({ LocalNotifications }) => {
      LocalNotifications.addListener("localNotificationActionPerformed", () => {
        // 알림 클릭 시 캘린더 페이지로 이동
        if (window.location.pathname !== "/calendar") {
          window.location.href = "/calendar";
        }
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const key = events
      .filter((e) => e.notifyBefore !== null && e.notifyBefore !== undefined)
      .map((e) => `${e.id}_${e.notifyBefore}_${e.startDate}`)
      .join("|");

    if (key === prevEventsRef.current) return;
    prevEventsRef.current = key;

    scheduleLocalNotifications(events);
  }, [events]);
}

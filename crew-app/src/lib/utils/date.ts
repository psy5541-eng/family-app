/**
 * 상대 시간 표시 (예: "3분 전", "2시간 전")
 */
export function formatRelativeTime(date: Date | number): string {
  const now = Date.now();
  const target = date instanceof Date ? date.getTime() : date;
  const diffMs = now - target;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffWeek < 4) return `${diffWeek}주 전`;

  return formatDate(date);
}

/**
 * 날짜 포맷 (예: "2024. 3. 10.")
 */
export function formatDate(date: Date | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * D-day 계산 (예: "D-3", "D-day", "D+2")
 */
export function calcDday(targetDate: Date | number): string {
  const now = new Date();
  const target = targetDate instanceof Date ? targetDate : new Date(targetDate);

  // 시간 제거 (날짜만 비교)
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  const diffDay = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDay === 0) return "D-day";
  if (diffDay > 0) return `D-${diffDay}`;
  return `D+${Math.abs(diffDay)}`;
}

/**
 * 일정 날짜/시간 포맷 (예: "3월 10일 오후 2:30")
 */
export function formatEventDate(date: Date | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

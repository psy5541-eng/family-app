import type { PointSetting } from "@/types/db";

type ActivityForPoints = {
  activityType: "running" | "trail_running" | "walking";
  distance: number; // km
  elevation: number | null; // m
};

const DEFAULT_SETTINGS: PointSetting = {
  id: "default",
  pointsPerKm: 10,
  bonus10km: 50,
  bonusHalfMarathon: 200,
  bonusFullMarathon: 500,
  multiplierRunning: 1.0,
  multiplierTrail: 1.5,
  multiplierWalking: 0.5,
  pointsPer100mElevation: 10,
  updatedAt: new Date(),
  updatedBy: null,
};

export function calculatePoints(
  activity: ActivityForPoints,
  settings?: PointSetting | null
): number {
  const s = settings ?? DEFAULT_SETTINGS;

  // 1. 기본 거리 포인트
  let points = Math.floor(activity.distance * s.pointsPerKm);

  // 2. 종목별 배율 적용
  const multiplier =
    activity.activityType === "trail_running"
      ? s.multiplierTrail
      : activity.activityType === "walking"
        ? s.multiplierWalking
        : s.multiplierRunning;
  points = Math.floor(points * multiplier);

  // 3. 거리 보너스
  if (activity.distance >= 42.195) {
    points += s.bonusFullMarathon;
  } else if (activity.distance >= 21.0975) {
    points += s.bonusHalfMarathon;
  } else if (activity.distance >= 10) {
    points += s.bonus10km;
  }

  // 4. 고도 보너스
  if (activity.elevation && activity.elevation > 0) {
    points += Math.floor((activity.elevation / 100) * s.pointsPer100mElevation);
  }

  return points;
}

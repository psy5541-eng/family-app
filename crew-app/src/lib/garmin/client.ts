import { GarminConnect } from "garmin-connect";
import { decryptPassword } from "./crypto";

export type GarminActivity = {
  activityId: number;
  activityName: string;
  activityType: { typeKey: string };
  startTimeLocal: string;
  startTimeGMT: string; // 기기 원본 시간 (UTC)
  beginTimestamp: number; // epoch ms (기기 기록 시점)
  duration: number; // 초
  distance: number; // 미터 (편집 가능한 값)
  averageSpeed: number; // m/s
  averageHR?: number;
  calories?: number;
  elevationGain?: number;
  elevationLoss?: number;
  // 조작 감지용 필드
  manualActivity?: boolean; // true면 수동 입력 (기기 기록 아님)
  deviceId?: number; // 기기 ID (없으면 수동 입력)
  hasPolyline?: boolean; // GPS 경로 유무
  summarizedDivesCount?: number;
};

// 가민 활동 타입 → 우리 타입 매핑
function mapActivityType(typeKey: string): "running" | "trail_running" | "walking" | null {
  const mapping: Record<string, "running" | "trail_running" | "walking"> = {
    running: "running",
    street_running: "running",
    track_running: "running",
    treadmill_running: "running",
    trail_running: "trail_running",
    walking: "walking",
    hiking: "walking",
    casual_walking: "walking",
  };
  return mapping[typeKey] ?? null;
}

// 가민 로그인 후 활동 데이터 가져오기
export type LapData = {
  lapNum: number;
  distance: number; // km
  duration: number; // 초
  pace: number; // 초/km
};

export async function fetchGarminActivities(
  garminEmail: string,
  encryptedPassword: string,
  sinceDate?: Date
): Promise<{
  activities: Array<{
    garminActivityId: string;
    activityType: "running" | "trail_running" | "walking";
    title: string;
    startTime: Date;
    duration: number;
    distance: number; // km
    pace: number | null; // 초/km
    heartRate: number | null;
    calories: number | null;
    elevation: number | null;
    elevationLoss: number | null;
    laps: LapData[] | null;
  }>;
}> {
  const password = decryptPassword(encryptedPassword);
  const GC = new GarminConnect({
    username: garminEmail,
    password,
  });

  await GC.login();

  // 첫 동기화: 최근 1개만 (테스트용, 연동 확인)
  // 이후 동기화: lastSyncAt 이후 활동 전부 가져옴
  const isFirstSync = !sinceDate;
  const fetchCount = isFirstSync ? 1 : 50;
  const rawActivities = (await GC.getActivities(0, fetchCount)) as GarminActivity[];

  const mappedActivities = rawActivities
    .filter((a) => {
      // 수동 입력 활동 제외 (기기에서 기록된 것만)
      if (a.manualActivity) return false;

      // 기기 ID 없는 활동 제외 (웹/앱에서 수동 생성)
      if (!a.deviceId) return false;

      // startTimeLocal(편집 가능)과 startTimeGMT(원본)의 날짜가 다르면 날짜 조작
      // GMT와 Local은 시차로 시간은 다를 수 있지만, 날짜가 하루 이상 차이나면 편집된 것
      if (a.startTimeGMT && a.startTimeLocal) {
        const gmtDate = new Date(a.startTimeGMT).getTime();
        const localDate = new Date(a.startTimeLocal).getTime();
        const diffHours = Math.abs(gmtDate - localDate) / (1000 * 60 * 60);
        // 시차는 최대 ±14시간, 그 이상이면 날짜 조작
        if (diffHours > 14) return false;
      }

      // beginTimestamp(기기 기록 시점)와 startTimeLocal 비교
      // beginTimestamp는 편집 불가 — 날짜를 바꿔도 이 값은 안 변함
      if (a.beginTimestamp && a.startTimeLocal) {
        const deviceTime = a.beginTimestamp;
        const displayTime = new Date(a.startTimeLocal).getTime();
        const diffHours = Math.abs(deviceTime - displayTime) / (1000 * 60 * 60);
        // 24시간 이상 차이나면 날짜 조작으로 판단
        if (diffHours > 24) return false;
      }

      // sinceDate 필터 (이후 동기화 시)
      if (!isFirstSync) {
        const activityDate = new Date(a.startTimeLocal);
        if (activityDate < sinceDate!) return false;
      }

      return true;
    })
    .map((a) => {
      const type = mapActivityType(a.activityType?.typeKey ?? "");
      if (!type) return null;
      return { ...a, mappedType: type };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  // 각 활동의 상세 데이터에서 원본 거리 + km별 랩 데이터 가져오기
  const activities = [];
  for (const a of mappedActivities) {
    const durationSec = Math.round(a.duration ?? 0);
    let distanceMeters = a.distance ?? 0;
    let laps: LapData[] | null = null;

    try {
      // 1) getActivity: splitSummaries에서 INTERVAL_ACTIVE 원본 거리
      const detail = await GC.getActivity({ activityId: String(a.activityId) }) as Record<string, unknown>;
      const splitSummaries = detail?.splitSummaries as Array<{ distance?: number; duration?: number; splitType?: string }> | undefined;

      if (splitSummaries && splitSummaries.length > 0) {
        const activeSplit = splitSummaries.find((s) => s.splitType === "INTERVAL_ACTIVE");
        if (activeSplit?.distance && activeSplit.distance > 0) {
          distanceMeters = activeSplit.distance;
        }
      }

      // 2) splits API: km별 랩 데이터 (편집 불가)
      try {
        const splitsUrl = `https://connectapi.garmin.com/activity-service/activity/${a.activityId}/splits`;
        const splitsData = await GC.get(splitsUrl) as Record<string, unknown>;
        const lapDTOs = splitsData?.lapDTOs as Array<{
          distance?: number; duration?: number; startTimeGMT?: string;
          averageSpeed?: number; maxSpeed?: number;
        }> | undefined;

        if (lapDTOs && lapDTOs.length > 0) {
          laps = lapDTOs.map((lap, i) => {
            const lapDistKm = (lap.distance ?? 0) / 1000;
            const lapDur = Math.round(lap.duration ?? 0);
            const lapPace = lapDistKm > 0 ? Math.round(lapDur / lapDistKm) : 0;
            return { lapNum: i + 1, distance: Math.round(lapDistKm * 100) / 100, duration: lapDur, pace: lapPace };
          });
        }
      } catch {
        // splits API 실패 시 무시 (랩 데이터 없음)
      }
    } catch (err) {
      console.warn(`Failed to get detail for activity ${a.activityId}:`, err);
    }

    const distanceKm = distanceMeters / 1000;
    const pace = distanceKm > 0 ? Math.round(durationSec / distanceKm) : null;

    activities.push({
      garminActivityId: String(a.activityId),
      activityType: a.mappedType,
      title: a.activityName ?? `${a.mappedType} activity`,
      startTime: a.beginTimestamp ? new Date(a.beginTimestamp) : new Date(a.startTimeGMT || a.startTimeLocal),
      duration: durationSec,
      distance: Math.round(distanceKm * 100) / 100,
      pace,
      heartRate: a.averageHR ? Math.round(a.averageHR) : null,
      calories: a.calories ? Math.round(a.calories) : null,
      elevation: a.elevationGain ? Math.round(a.elevationGain * 10) / 10 : null,
      elevationLoss: a.elevationLoss ? Math.round(a.elevationLoss * 10) / 10 : null,
      laps,
    });
  }

  return { activities };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type PointSettings = {
  pointsPerKm: number;
  bonus10km: number;
  bonusHalfMarathon: number;
  bonusFullMarathon: number;
  multiplierRunning: number;
  multiplierTrail: number;
  multiplierWalking: number;
  pointsPer100mElevation: number;
};

export default function PointSettingsPage() {
  const router = useRouter();
  const { getAuthHeader } = useAuth();
  const [settings, setSettings] = useState<PointSettings>({
    pointsPerKm: 10,
    bonus10km: 50,
    bonusHalfMarathon: 200,
    bonusFullMarathon: 500,
    multiplierRunning: 1.0,
    multiplierTrail: 1.5,
    multiplierWalking: 0.5,
    pointsPer100mElevation: 10,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/points", { headers: getAuthHeader() });
      const json = await res.json();
      if (json.success) setSettings(json.data);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/points", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        setMessage("저장되었습니다.");
        setTimeout(() => setMessage(null), 2000);
      }
    } finally {
      setIsSaving(false);
    }
  }

  function updateField(field: keyof PointSettings, value: string) {
    const num = field.startsWith("multiplier") ? parseFloat(value) : parseInt(value);
    if (!isNaN(num)) {
      setSettings((prev) => ({ ...prev, [field]: num }));
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fields: { key: keyof PointSettings; label: string; desc: string; step?: string }[] = [
    { key: "pointsPerKm", label: "km당 포인트", desc: "거리 1km마다 적립되는 기본 포인트" },
    { key: "bonus10km", label: "10km 보너스", desc: "10km 이상 달성 시 추가 포인트" },
    { key: "bonusHalfMarathon", label: "하프마라톤 보너스", desc: "21.0975km 이상 달성 시 추가 포인트" },
    { key: "bonusFullMarathon", label: "풀마라톤 보너스", desc: "42.195km 이상 달성 시 추가 포인트" },
    { key: "multiplierRunning", label: "러닝 배율", desc: "러닝 종목 포인트 배율", step: "0.1" },
    { key: "multiplierTrail", label: "트레일 배율", desc: "트레일 러닝 포인트 배율", step: "0.1" },
    { key: "multiplierWalking", label: "걷기 배율", desc: "걷기 종목 포인트 배율", step: "0.1" },
    { key: "pointsPer100mElevation", label: "고도 100m당 포인트", desc: "누적 상승고도 100m마다 추가 포인트" },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      {message && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white bg-green-500">
          {message}
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">포인트 설정</h1>
      </div>

      <div className="space-y-3">
        {fields.map(({ key, label, desc, step }) => (
          <div key={key} className="bg-white dark:bg-gray-800 rounded-xl p-3.5 shadow-sm">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 mb-2">{desc}</p>
            <input
              type="number"
              step={step ?? "1"}
              value={settings[key]}
              onChange={(e) => updateField(key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full mt-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
      >
        {isSaving ? "저장 중..." : "설정 저장"}
      </button>
    </div>
  );
}

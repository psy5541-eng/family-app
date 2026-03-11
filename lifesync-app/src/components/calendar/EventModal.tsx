"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/types/db";
import type { EventFormData } from "@/hooks/useCalendar";
import PlaceSearch from "./PlaceSearch";

type EventModalProps = {
  date: Date;
  event?: CalendarEvent | null;  // null이면 생성, 있으면 수정
  onSave: (data: EventFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
};

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toLocalDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function EventModal({ date, event, onSave, onDelete, onClose }: EventModalProps) {
  const isEdit = !!event;

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay ?? false);
  const [isDday, setIsDday] = useState(event?.isDday ?? false);
  const [startDate, setStartDate] = useState(() => {
    const d = event?.startDate instanceof Date ? event.startDate : event?.startDate ? new Date(event.startDate) : date;
    return isAllDay ? toLocalDateString(d) : toLocalDateTimeString(d);
  });
  const [endDate, setEndDate] = useState(() => {
    if (!event?.endDate) return "";
    const d = event.endDate instanceof Date ? event.endDate : new Date(event.endDate);
    return isAllDay ? toLocalDateString(d) : toLocalDateTimeString(d);
  });
  const [placeName, setPlaceName] = useState(event?.placeName ?? "");
  const [placeAddress, setPlaceAddress] = useState(event?.placeAddress ?? "");
  const [latitude, setLatitude] = useState(event?.latitude ?? "");
  const [longitude, setLongitude] = useState(event?.longitude ?? "");
  const [naverPlaceId, setNaverPlaceId] = useState(event?.naverPlaceId ?? "");
  const [notifyBefore, setNotifyBefore] = useState<number | "">(event?.notifyBefore ?? "");
  const [isShared, setIsShared] = useState(event?.isShared ?? false);
  const [color, setColor] = useState(event?.color ?? "primary");

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);

  function handleSelectPlace(place: { id: string; name: string; address: string; roadAddress: string; latitude: string; longitude: string }) {
    setPlaceName(place.name);
    setPlaceAddress(place.roadAddress || place.address);
    setLatitude(place.latitude);
    setLongitude(place.longitude);
    setNaverPlaceId(place.id);
    setShowPlaceSearch(false);
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    if (!startDate) {
      setError("시작 날짜를 입력해주세요.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        isAllDay,
        isDday,
        placeName: placeName || undefined,
        placeAddress: placeAddress || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        naverPlaceId: naverPlaceId || undefined,
        notifyBefore: notifyBefore !== "" ? notifyBefore : undefined,
        isShared,
        color,
      });
    } catch {
      setError("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete || !confirm("이 일정을 삭제하시겠습니까?")) return;
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
        <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <button onClick={onClose} className="text-sm text-gray-600 dark:text-gray-400">
              취소
            </button>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {isEdit ? "일정 수정" : "새 일정"}
            </h2>
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="text-sm font-semibold text-primary-600 disabled:text-gray-400"
            >
              {isSaving ? "저장 중..." : "저장"}
            </button>
          </div>

          {/* 폼 */}
          <div className="p-4 space-y-4">
            {/* 제목 */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목"
              autoFocus
              className="w-full text-lg font-medium text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-gray-600 pb-2 outline-none placeholder-gray-300"
            />

            {/* 종일 / D-day 토글 */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setIsAllDay((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${isAllDay ? "bg-primary-500" : "bg-gray-200 dark:bg-gray-600"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${isAllDay ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">종일</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setIsDday((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${isDday ? "bg-red-500" : "bg-gray-200 dark:bg-gray-600"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${isDday ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">D-day</span>
              </label>
            </div>

            {/* 공유 토글 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setIsShared((v) => !v)}
                className={`w-10 h-5 rounded-full transition-colors relative ${isShared ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-600"}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${isShared ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">공유 일정</span>
              {isShared && <span className="text-xs text-blue-500">모든 사용자에게 표시됩니다</span>}
            </label>

            {/* 색상 선택 */}
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500 dark:text-gray-400">색상</p>
              <div className="flex gap-2">
                {([
                  { key: "primary", bg: "bg-primary-500", ring: "ring-primary-500" },
                  { key: "rose", bg: "bg-rose-500", ring: "ring-rose-500" },
                  { key: "amber", bg: "bg-amber-500", ring: "ring-amber-500" },
                  { key: "emerald", bg: "bg-emerald-500", ring: "ring-emerald-500" },
                  { key: "violet", bg: "bg-violet-500", ring: "ring-violet-500" },
                ] as const).map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setColor(c.key)}
                    className={`w-7 h-7 rounded-full ${c.bg} transition-all ${
                      color === c.key ? `ring-2 ${c.ring} ring-offset-2 dark:ring-offset-gray-800 scale-110` : "opacity-60 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 날짜/시간 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <input
                  type={isAllDay ? "date" : "datetime-local"}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-1.5 outline-none"
                />
              </div>
              <div className="flex items-center gap-2 pl-6">
                <span className="text-xs text-gray-400">종료</span>
                <input
                  type={isAllDay ? "date" : "datetime-local"}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-1.5 outline-none"
                />
              </div>
            </div>

            {/* 장소 */}
            <div className="space-y-1">
              <div
                onClick={() => setShowPlaceSearch(true)}
                className="w-full flex items-center gap-2 text-left cursor-pointer"
              >
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {placeName ? (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">{placeName}</p>
                    {placeAddress && <p className="text-xs text-gray-400 truncate">{placeAddress}</p>}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">장소 추가</span>
                )}
                {placeName && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlaceName(""); setPlaceAddress(""); setLatitude(""); setLongitude(""); setNaverPlaceId("");
                    }}
                    className="ml-auto p-1 text-gray-300 hover:text-red-400"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* C6: 장소 지도 카드 (장소 + 좌표가 있을 때) */}
            {placeName && latitude && longitude && (
              <a
                href={`nmap://place?lat=${latitude}&lng=${longitude}&name=${encodeURIComponent(placeName)}&appname=com.lifesync.app`}
                onClick={() => {
                  setTimeout(() => {
                    window.location.href = `https://map.naver.com/v5/search/${encodeURIComponent(placeName)}?c=${longitude},${latitude},15,0,0,0,dh`;
                  }, 500);
                }}
                className="block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600"
              >
                {/* 지도 미리보기 영역 */}
                <div className="relative w-full h-28 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  {/* 격자 패턴 (지도 느낌) */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                  </div>
                  {/* 마커 */}
                  <div className="relative flex flex-col items-center">
                    <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md mb-1 max-w-[180px] truncate">
                      {placeName}
                    </div>
                    <svg className="w-8 h-8 text-red-500 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                  {/* 네이버 지도 로고 */}
                  <div className="absolute bottom-1 right-2 text-[9px] text-gray-400 font-medium">NAVER Map</div>
                </div>
                <div className="px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{placeName}</p>
                    <p className="text-[10px] text-gray-400 truncate">{placeAddress}</p>
                  </div>
                  <div className="flex items-center gap-1 text-primary-500 flex-shrink-0 ml-2">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    <span className="text-[10px] font-medium">지도 열기</span>
                  </div>
                </div>
              </a>
            )}

            {/* 설명 */}
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
              </svg>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="설명 추가"
                rows={2}
                className="flex-1 text-sm text-gray-800 dark:text-gray-200 bg-transparent outline-none resize-none placeholder-gray-400"
              />
            </div>

            {/* 알림 */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              <select
                value={notifyBefore}
                onChange={(e) => setNotifyBefore(e.target.value === "" ? "" : Number(e.target.value))}
                className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg px-2 py-1.5 outline-none"
              >
                <option value="">알림 없음</option>
                <option value="0">정시</option>
                <option value="5">5분 전</option>
                <option value="10">10분 전</option>
                <option value="30">30분 전</option>
                <option value="60">1시간 전</option>
                <option value="1440">1일 전</option>
              </select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* 삭제 버튼 */}
            {isEdit && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full py-2.5 text-sm text-red-500 font-medium border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 mt-2"
              >
                {isDeleting ? "삭제 중..." : "일정 삭제"}
              </button>
            )}
          </div>
        </div>
      </div>

      {showPlaceSearch && (
        <PlaceSearch
          onSelect={handleSelectPlace}
          onClose={() => setShowPlaceSearch(false)}
        />
      )}
    </>
  );
}

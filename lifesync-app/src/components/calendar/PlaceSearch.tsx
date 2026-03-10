"use client";

import { useState, useRef } from "react";

type PlaceItem = {
  id: string;
  name: string;
  address: string;
  roadAddress: string;
  latitude: string;
  longitude: string;
  category: string;
};

type PlaceSearchProps = {
  onSelect: (place: PlaceItem) => void;
  onClose: () => void;
};

export default function PlaceSearch({ onSelect, onClose }: PlaceSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/naver/place?query=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success) setResults(json.data.items);
      else setResults([]);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[70vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="flex-1 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="장소 검색 (예: 스타벅스 강남)"
              autoFocus
              className="flex-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2 outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-xl disabled:opacity-50"
            >
              {isSearching ? "..." : "검색"}
            </button>
          </div>
        </div>

        {/* 결과 목록 */}
        <div className="flex-1 overflow-y-auto">
          {!searched && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <p className="text-sm">장소를 검색하세요</p>
            </div>
          )}

          {searched && results.length === 0 && !isSearching && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          )}

          {results.map((place) => (
            <button
              key={place.id}
              onClick={() => onSelect(place)}
              className="w-full text-left px-4 py-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{place.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {place.roadAddress || place.address}
                  </p>
                  {place.category && (
                    <p className="text-[10px] text-primary-400 mt-0.5">{place.category}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

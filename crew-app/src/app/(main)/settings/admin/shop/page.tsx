"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { ShopItem } from "@/types/db";

type CategoryType = "hat" | "top" | "bottom" | "shoes" | "char_effect" | "text_effect";

const CATEGORY_LABELS: Record<CategoryType, string> = {
  hat: "모자",
  top: "상의",
  bottom: "하의",
  shoes: "신발",
  char_effect: "캐릭터 효과",
  text_effect: "텍스트 효과",
};

export default function AdminShopPage() {
  const router = useRouter();
  const { getAuthHeader } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  type GenderType = "unisex" | "male" | "female";

  // 새 아이템 폼
  const [newItem, setNewItem] = useState({
    category: "hat" as CategoryType,
    gender: "unisex" as GenderType,
    name: "",
    price: 100,
    rarity: "common" as "common" | "rare" | "epic",
    effectType: "",
    effectColors: "",
  });

  function showMsg(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/shop", { headers: getAuthHeader() });
      const json = await res.json();
      if (json.success) setItems(json.data);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function handleAdd() {
    if (!newItem.name.trim()) return;
    const res = await fetch("/api/admin/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({
        ...newItem,
        gender: newItem.gender,
        effectType: newItem.effectType || undefined,
        effectColors: newItem.effectColors || undefined,
      }),
    });
    const json = await res.json();
    if (json.success) {
      showMsg("success", "아이템이 추가되었습니다.");
      setShowAddForm(false);
      setNewItem({ category: "hat", gender: "unisex", name: "", price: 100, rarity: "common", effectType: "", effectColors: "" });
      loadItems();
    } else {
      showMsg("error", json.error ?? "추가 실패");
    }
  }

  async function handleToggleActive(item: ShopItem) {
    const res = await fetch("/api/admin/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
    });
    const json = await res.json();
    if (json.success) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i))
      );
    }
  }

  async function handleDelete(itemId: string) {
    if (!confirm("이 아이템을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/shop?id=${itemId}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    const json = await res.json();
    if (json.success) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      showMsg("success", "삭제되었습니다.");
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {message.text}
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1">상점 아이템 관리</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg"
        >
          {showAddForm ? "취소" : "+ 추가"}
        </button>
      </div>

      {/* 추가 폼 */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">카테고리</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value as CategoryType })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">성별</label>
              <select
                value={newItem.gender}
                onChange={(e) => setNewItem({ ...newItem, gender: e.target.value as GenderType })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              >
                <option value="unisex">공용</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">이름</label>
            <input
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="아이템 이름"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">가격 (P)</label>
              <input
                type="number"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">레어리티</label>
              <select
                value={newItem.rarity}
                onChange={(e) => setNewItem({ ...newItem, rarity: e.target.value as "common" | "rare" | "epic" })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              >
                <option value="common">일반</option>
                <option value="rare">레어</option>
                <option value="epic">에픽</option>
              </select>
            </div>
          </div>
          {newItem.category === "text_effect" && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">효과 타입</label>
                <select
                  value={newItem.effectType}
                  onChange={(e) => setNewItem({ ...newItem, effectType: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                >
                  <option value="">선택</option>
                  <option value="sparkle">반짝이</option>
                  <option value="rainbow">무지개</option>
                  <option value="flame">불꽃</option>
                  <option value="glow">글로우</option>
                  <option value="neon">네온</option>
                  <option value="gradient">그라디언트</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">색상 (JSON)</label>
                <input
                  value={newItem.effectColors}
                  onChange={(e) => setNewItem({ ...newItem, effectColors: e.target.value })}
                  placeholder='["#ff0","#f00"]'
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}
          <button
            onClick={handleAdd}
            disabled={!newItem.name.trim()}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            아이템 추가
          </button>
        </div>
      )}

      {/* 아이템 리스트 */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
          등록된 아이템이 없습니다
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-3.5 shadow-sm flex items-center gap-3 ${
                !item.isActive ? "opacity-50" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-lg">
                {item.category === "hat" ? "🧢" :
                 item.category === "top" ? "👕" :
                 item.category === "bottom" ? "👖" :
                 item.category === "shoes" ? "👟" :
                 item.category === "char_effect" ? "✨" : "🔤"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                  <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                    item.rarity === "epic" ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                    item.rarity === "rare" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                    "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}>
                    {item.rarity === "epic" ? "에픽" : item.rarity === "rare" ? "레어" : "일반"}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {CATEGORY_LABELS[item.category as CategoryType]} · {item.price}P · {
                    (item as ShopItem & { gender?: string }).gender === "male" ? "남성" :
                    (item as ShopItem & { gender?: string }).gender === "female" ? "여성" : "공용"
                  }
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleToggleActive(item)}
                  className={`text-[10px] px-2 py-1 rounded-lg font-medium ${
                    item.isActive
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {item.isActive ? "활성" : "비활성"}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-[10px] px-2 py-1 rounded-lg font-medium text-red-500 bg-red-50 dark:bg-red-900/20"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { ShopItemWithOwnership } from "@/types/db";

type CategoryType = "all" | "hat" | "top" | "bottom" | "shoes" | "char_effect" | "text_effect";

const CATEGORIES: { key: CategoryType; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "hat", label: "모자" },
  { key: "top", label: "상의" },
  { key: "bottom", label: "하의" },
  { key: "shoes", label: "신발" },
  { key: "char_effect", label: "캐릭터 효과" },
  { key: "text_effect", label: "텍스트 효과" },
];

const RARITY_COLORS: Record<string, string> = {
  common: "border-gray-200 dark:border-gray-700",
  rare: "border-blue-400 dark:border-blue-500",
  epic: "border-purple-500 dark:border-purple-400",
};

const RARITY_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  common: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-500 dark:text-gray-400", label: "일반" },
  rare: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", label: "레어" },
  epic: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", label: "에픽" },
};

export default function ShopPage() {
  const { getAuthHeader } = useAuth();
  const [category, setCategory] = useState<CategoryType>("all");
  const [items, setItems] = useState<ShopItemWithOwnership[]>([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showInventory, setShowInventory] = useState(false);

  function showMsg(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const param = category !== "all" ? `?category=${category}` : "";
      const res = await fetch(`/api/shop${param}`, { headers: getAuthHeader() });
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items);
        setCurrentPoints(json.data.currentPoints);
      }
    } finally {
      setIsLoading(false);
    }
  }, [category, getAuthHeader]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function handleBuy(itemId: string, itemName: string, price: number) {
    if (!confirm(`${itemName}을(를) ${price}P에 구매하시겠습니까?`)) return;
    setBuyingId(itemId);
    try {
      const res = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ itemId }),
      });
      const json = await res.json();
      if (json.success) {
        setCurrentPoints(json.data.remainingPoints);
        setItems((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, owned: true } : item))
        );
        showMsg("success", `${itemName} 구매 완료!`);
      } else {
        showMsg("error", json.error ?? "구매에 실패했습니다.");
      }
    } finally {
      setBuyingId(null);
    }
  }

  async function handleEquip(itemId: string, itemCategory: string) {
    const categoryToField: Record<string, string> = {
      hat: "equippedHat",
      top: "equippedTop",
      bottom: "equippedBottom",
      shoes: "equippedShoes",
      char_effect: "equippedCharEffect",
    };

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    // text_effect는 별도 처리
    if (itemCategory === "text_effect") {
      const res = await fetch("/api/character", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          nicknameEffectType: item.equipped ? null : item.effectType,
          nicknameEffectColors: item.equipped ? null : item.effectColors,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) =>
          prev.map((i) => {
            if (i.category === "text_effect") return { ...i, equipped: i.id === itemId ? !i.equipped : false };
            return i;
          })
        );
        showMsg("success", item.equipped ? "효과 해제" : "효과 적용!");
      }
      return;
    }

    const field = categoryToField[itemCategory];
    if (!field) return;

    const res = await fetch("/api/character", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ [field]: item.equipped ? null : itemId }),
    });
    const json = await res.json();
    if (json.success) {
      setItems((prev) =>
        prev.map((i) => {
          if (i.category === itemCategory) return { ...i, equipped: i.id === itemId ? !i.equipped : false };
          return i;
        })
      );
      showMsg("success", item.equipped ? "장착 해제" : "장착 완료!");
    }
  }

  const displayItems = showInventory ? items.filter((i) => i.owned) : items;

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      {/* 토스트 */}
      {message && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white ${
            message.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 내 포인트 */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">보유 포인트</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {currentPoints.toLocaleString()} P
          </p>
        </div>
        <button
          onClick={() => setShowInventory(!showInventory)}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            showInventory
              ? "bg-primary-500 text-white"
              : "bg-amber-500 text-white hover:bg-amber-600"
          }`}
        >
          {showInventory ? "상점으로" : "내 인벤토리"}
        </button>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              category === cat.key
                ? "bg-primary-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 아이템 그리드 */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayItems.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">
          {showInventory ? "보유한 아이템이 없습니다" : "상점 아이템이 없습니다"}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border-2 ${RARITY_COLORS[item.rarity]}`}
            >
              {/* 미리보기 */}
              <div className="aspect-square bg-gray-50 dark:bg-gray-900 flex items-center justify-center relative">
                {item.previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.previewImage} alt={item.name} className="w-full h-full object-contain p-2" />
                ) : item.category === "text_effect" && item.effectType ? (
                  <span className={`text-lg font-bold text-effect-${item.effectType}`}>
                    {item.name}
                  </span>
                ) : (
                  <span className="text-3xl">
                    {item.category === "hat" ? "🧢" :
                     item.category === "top" ? "👕" :
                     item.category === "bottom" ? "👖" :
                     item.category === "shoes" ? "👟" :
                     item.category === "char_effect" ? "✨" : "🔤"}
                  </span>
                )}
                {/* 레어리티 뱃지 */}
                {item.rarity !== "common" && (
                  <span className={`absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${RARITY_BADGE[item.rarity].bg} ${RARITY_BADGE[item.rarity].text}`}>
                    {RARITY_BADGE[item.rarity].label}
                  </span>
                )}
                {item.equipped && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                    장착중
                  </span>
                )}
              </div>

              {/* 정보 */}
              <div className="p-2.5">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">{item.price}P</p>

                {/* 액션 버튼 */}
                {item.owned ? (
                  <button
                    onClick={() => handleEquip(item.id, item.category)}
                    className={`w-full mt-2 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      item.equipped
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        : "bg-primary-500 text-white hover:bg-primary-600"
                    }`}
                  >
                    {item.equipped ? "해제" : "장착"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(item.id, item.name, item.price)}
                    disabled={buyingId === item.id || currentPoints < item.price}
                    className="w-full mt-2 py-1.5 text-xs font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
                  >
                    {buyingId === item.id ? "구매 중..." : currentPoints < item.price ? "포인트 부족" : "구매"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

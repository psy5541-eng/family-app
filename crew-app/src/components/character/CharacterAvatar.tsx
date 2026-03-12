"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type EquipmentLayers = {
  top?: string | null;    // 아이템 ID or 파일명 접두사 (예: "idle-top-female")
  bottom?: string | null;
  shoes?: string | null;
  hat?: string | null;
};

type CharacterAvatarProps = {
  gender: "male" | "female";
  mode?: "idle" | "run";
  frame?: number; // 외부 제어 시 사용 (1~4)
  animate?: boolean; // true면 자동 프레임 순환
  fps?: number; // 애니메이션 속도 (기본: idle 4, run 8)
  size?: number; // px
  className?: string;
  equipment?: EquipmentLayers; // 장착 아이템 레이어
};

export default function CharacterAvatar({
  gender,
  mode = "idle",
  frame,
  animate = true,
  fps,
  size = 128,
  className = "",
  equipment,
}: CharacterAvatarProps) {
  const defaultFps = 8;
  const actualFps = fps ?? defaultFps;

  const [internalFrame, setInternalFrame] = useState(1);

  useEffect(() => {
    if (!animate || frame !== undefined) return;
    const interval = setInterval(() => {
      setInternalFrame((f) => (f % 4) + 1);
    }, 1000 / actualFps);
    return () => clearInterval(interval);
  }, [animate, frame, actualFps]);

  const currentFrame = frame ?? internalFrame;
  const prefix = mode === "idle" ? "idle" : "run";
  const folder = mode === "idle" ? "base" : "run";

  // 페이퍼돌 레이어 순서: base → shoes → bottom → top → hat
  const layers: { folder: string; prefix: string }[] = [
    { folder, prefix: `${prefix}-${gender}` }, // base 맨몸
  ];

  if (equipment?.shoes) {
    layers.push({ folder: "shoes", prefix: equipment.shoes });
  }
  if (equipment?.bottom) {
    layers.push({ folder: "bottom", prefix: equipment.bottom });
  }
  if (equipment?.top) {
    layers.push({ folder: "top", prefix: equipment.top });
  }
  if (equipment?.hat) {
    layers.push({ folder: "hat", prefix: equipment.hat });
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    >
      {layers.map((layer, li) =>
        [1, 2, 3, 4].map((f) => (
          <Image
            key={`${li}-${f}`}
            src={`/assets/character/${layer.folder}/${layer.prefix}-${f}.png`}
            alt=""
            width={size * 2}
            height={size * 2}
            className="absolute inset-0 w-full h-full object-contain"
            style={{ display: currentFrame === f ? "block" : "none" }}
            priority
            unoptimized
          />
        ))
      )}
    </div>
  );
}

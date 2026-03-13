"use client";

type EquipmentLayers = {
  top?: string | null;
  bottom?: string | null;
  shoes?: string | null;
  hair?: string | null;
  hat?: string | null;
};

type CharacterAvatarProps = {
  gender: "male" | "female";
  mode?: "idle" | "run";
  animate?: boolean;
  fps?: number;
  size?: number;
  className?: string;
  equipment?: EquipmentLayers;
};

export default function CharacterAvatar({
  gender,
  mode = "idle",
  animate = true,
  fps,
  size = 128,
  className = "",
  equipment,
}: CharacterAvatarProps) {
  const defaultFps = 8;
  const actualFps = fps ?? defaultFps;
  const action = mode === "idle" ? "idle" : "run";
  const duration = 4 / actualFps;

  // 페이퍼돌 레이어 순서: base → shoes → bottom → top → hair → hat
  const sheets: string[] = [
    `/assets/character/base/${action}-${gender}.png`,
  ];

  if (equipment?.shoes) {
    sheets.push(`/assets/character/shoes/${equipment.shoes}-${action}-${gender}.png`);
  }
  if (equipment?.bottom) {
    sheets.push(`/assets/character/bottom/${equipment.bottom}-${action}-${gender}.png`);
  }
  if (equipment?.top) {
    sheets.push(`/assets/character/top/${equipment.top}-${action}-${gender}.png`);
  }
  if (equipment?.hair) {
    sheets.push(`/assets/character/hair/${equipment.hair}-${action}-${gender}.png`);
  }
  if (equipment?.hat) {
    sheets.push(`/assets/character/hat/${equipment.hat}-${action}-${gender}.png`);
  }

  // 스프라이트 시트: 256x64 원본 → size*4 x size 로 렌더
  // background-position: -256px 0 → 4프레임 전체 이동
  // steps(4)로 프레임 단위 점프
  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {sheets.map((src, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            "--frame-size": `${size}px`,
            backgroundImage: `url(${src})`,
            backgroundSize: `${size * 4}px ${size}px`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "0 0",
            imageRendering: "pixelated",
            animation: animate
              ? `sprite-run ${duration}s steps(4) infinite`
              : undefined,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

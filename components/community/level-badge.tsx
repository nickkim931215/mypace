"use client";

import { useProfileLevel } from "@/hooks/use-profile-name";
import { LEVEL_TIERS, levelColor, isShimmerLevel, shimmerClass } from "@/lib/level";
import { cn } from "@/lib/utils";

// Small level chip (Lv.N + optional 칭호) next to a nickname in the community.
// Tinted with the level color; 인간병기 shimmers green, 최종 병기 shimmers gold.
// Reads the level live from the public profile; renders nothing until known.
export function LevelBadge({
  uid,
  withTitle = false,
}: {
  uid: string | null | undefined;
  withTitle?: boolean;
}) {
  const level = useProfileLevel(uid);
  if (!level) return null;
  const tier = LEVEL_TIERS[Math.min(Math.max(level, 1), LEVEL_TIERS.length) - 1];
  const color = levelColor(level);
  const shimmer = isShimmerLevel(level);
  const shimClass = shimmerClass(level);

  const inner = (
    <>
      <span className="tabular-nums">Lv.{level}</span>
      {withTitle && tier && <span className="font-medium">{tier.title}</span>}
    </>
  );

  return (
    <span
      className="inline-flex items-center rounded-full text-[10px] font-semibold leading-none px-1.5 py-0.5 align-middle shrink-0"
      style={{ backgroundColor: `${color}26` }}
    >
      <span
        className={cn("inline-flex items-center gap-1", shimClass)}
        style={shimmer ? undefined : { color }}
      >
        {inner}
      </span>
    </span>
  );
}

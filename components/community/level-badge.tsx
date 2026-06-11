"use client";

import { useProfileLevel } from "@/hooks/use-profile-name";
import { LEVEL_TIERS, levelColor, isShimmerLevel } from "@/lib/level";
import { cn } from "@/lib/utils";

// Small level chip (Lv.N + optional 칭호) next to a nickname in the community.
// Tinted with the level color; level 6 shimmers gold. Reads the level live from
// the public profile; renders nothing until the level is known.
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
        className={cn("inline-flex items-center gap-1", shimmer && "level-gold")}
        style={shimmer ? undefined : { color }}
      >
        {inner}
      </span>
    </span>
  );
}

"use client";

import { useProfileLevel } from "@/hooks/use-profile-name";
import { LEVEL_TIERS } from "@/lib/level";

// Small lime chip showing a user's gamified level (and optionally their 칭호)
// next to their nickname in the community. Reads the level live from the public
// profile; renders nothing until the level is known.
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

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 text-accent text-[10px] font-semibold leading-none px-1.5 py-0.5 align-middle shrink-0">
      <span className="tabular-nums">Lv.{level}</span>
      {withTitle && tier && <span className="font-medium">{tier.title}</span>}
    </span>
  );
}

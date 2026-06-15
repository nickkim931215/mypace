"use client";

import { useProfileLevel } from "@/hooks/use-profile-name";
import { levelColor, isShimmerLevel, shimmerClass } from "@/lib/level";
import { cn } from "@/lib/utils";

// Renders a nickname tinted with the author's level color. Level 1 (white) and
// unknown levels fall through to the default text color. 인간병기 shimmers
// green, 최종 병기 shimmers gold.
export function LevelName({
  uid,
  name,
  className,
}: {
  uid: string | null | undefined;
  name: string;
  className?: string;
}) {
  const level = useProfileLevel(uid);

  if (!level || level <= 1) {
    return <span className={className}>{name}</span>;
  }
  if (isShimmerLevel(level)) {
    return <span className={cn(className, shimmerClass(level))}>{name}</span>;
  }
  return (
    <span className={className} style={{ color: levelColor(level) }}>
      {name}
    </span>
  );
}

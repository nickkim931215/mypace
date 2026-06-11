"use client";

import { useProfileLevel } from "@/hooks/use-profile-name";
import { levelColor, isShimmerLevel } from "@/lib/level";
import { cn } from "@/lib/utils";

// Renders a nickname tinted with the author's level color. Level 1 (white) and
// unknown levels fall through to the default text color. Level 6 shimmers gold.
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
    return <span className={cn(className, "level-gold")}>{name}</span>;
  }
  return (
    <span className={className} style={{ color: levelColor(level) }}>
      {name}
    </span>
  );
}

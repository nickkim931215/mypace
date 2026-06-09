"use client";

import { Lock } from "lucide-react";
import type { BadgeProgress } from "@/lib/badges";
import { cn } from "@/lib/utils";

// Achievement grid for /history. Earned badges glow with the brand accent;
// locked ones are muted, show a lock, and a "current/goal" progress hint so the
// next unlock feels reachable.
export function BadgeGrid({ progress }: { progress: BadgeProgress[] }) {
  const earnedCount = progress.filter((p) => p.earned).length;

  return (
    <div className="card-premium p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          배지
        </h2>
        <span className="text-[12px] text-foreground-dim tabular-nums">
          {earnedCount} / {progress.length} 획득
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {progress.map((p) => (
          <BadgeCell key={p.badge.id} p={p} />
        ))}
      </div>
    </div>
  );
}

function BadgeCell({ p }: { p: BadgeProgress }) {
  const { badge, earned, current, goal, percent } = p;
  return (
    <div
      className={cn(
        "relative rounded-2xl border px-2 py-3.5 flex flex-col items-center text-center gap-1 transition-colors",
        earned
          ? "border-accent/40 bg-accent/[0.07]"
          : "border-border-subtle bg-surface-2/40",
      )}
      title={earned ? `획득: ${badge.description}` : badge.description}
    >
      <span
        className={cn(
          "text-[26px] leading-none transition-all",
          earned ? "drop-shadow-[0_0_10px_rgba(212,255,63,0.35)]" : "grayscale opacity-35",
        )}
      >
        {badge.emoji}
      </span>
      <span
        className={cn(
          "text-[12px] font-medium leading-tight mt-0.5",
          earned ? "text-foreground" : "text-foreground-muted",
        )}
      >
        {badge.name}
      </span>

      {earned ? (
        <span className="text-[10px] text-accent font-medium">획득 완료</span>
      ) : goal > 1 ? (
        <div className="w-full mt-0.5">
          <div className="h-1 rounded-full bg-surface-3 overflow-hidden">
            <div
              className="h-full bg-foreground-dim rounded-full"
              style={{ width: `${Math.round(percent * 100)}%` }}
            />
          </div>
          <span className="mt-1 block text-[10px] text-foreground-dim tabular-nums">
            {Math.min(current, goal)}/{goal}
          </span>
        </div>
      ) : (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-foreground-dim">
          <Lock size={9} />
          {badge.short}
        </span>
      )}
    </div>
  );
}

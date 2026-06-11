"use client";

import { Check } from "lucide-react";
import { LEVEL_TIERS, getLevel } from "@/lib/level";
import { cn } from "@/lib/utils";

// A compact, pretty overview of the whole 6-tier level ladder — current tier
// highlighted, cleared tiers checked, upcoming tiers muted. Pure text (no art).
export function LevelLadder({ count }: { count: number }) {
  const current = getLevel(count).level;

  return (
    <div className="card-premium p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          레벨 사다리
        </h2>
        <span className="text-[11px] uppercase tracking-[0.18em] text-foreground-dim">
          6단계
        </span>
      </div>

      <ol className="flex flex-col">
        {LEVEL_TIERS.map((tier, i) => {
          const next = LEVEL_TIERS[i + 1];
          const range = next ? `${tier.min}~${next.min - 1}회` : `${tier.min}회+`;
          const isCurrent = tier.level === current;
          const isDone = tier.level < current;
          const isLast = i === LEVEL_TIERS.length - 1;

          return (
            <li key={tier.level} className="flex items-stretch gap-3">
              {/* Rail + node */}
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-bold tabular-nums shrink-0 z-10 transition-colors",
                    isCurrent
                      ? "bg-accent text-background ring-4 ring-accent/20"
                      : isDone
                        ? "bg-accent/15 text-accent"
                        : "bg-surface-3 text-foreground-dim",
                  )}
                >
                  {isDone ? <Check size={14} strokeWidth={2.5} /> : tier.level}
                </span>
                {!isLast && (
                  <span
                    className={cn(
                      "w-0.5 flex-1 my-1 rounded-full",
                      isDone ? "bg-accent/30" : "bg-surface-3",
                    )}
                  />
                )}
              </div>

              {/* Tier label + threshold */}
              <div
                className={cn(
                  "flex-1 flex items-center justify-between gap-2",
                  isLast ? "pb-0" : "pb-5",
                )}
              >
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-[14px] font-medium truncate",
                      isCurrent
                        ? "text-accent"
                        : isDone
                          ? "text-foreground"
                          : "text-foreground-muted",
                    )}
                  >
                    {tier.title}
                  </p>
                  <p className="text-[11px] text-foreground-dim tabular-nums">
                    {range}
                  </p>
                </div>
                {isCurrent && (
                  <span className="shrink-0 text-[10px] font-semibold text-accent bg-accent/15 rounded-full px-2 py-0.5">
                    현재
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

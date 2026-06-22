"use client";

import { Check } from "lucide-react";
import { LEVEL_TIERS, getLevel, isShimmerLevel, shimmerClass } from "@/lib/level";
import { cn } from "@/lib/utils";
import { useT, useLocale } from "@/lib/i18n";

// A compact, pretty overview of the whole 7-tier level ladder — each tier shown
// in its own color, current tier highlighted, cleared tiers checked.
export function LevelLadder({ count }: { count: number }) {
  const t = useT();
  const { locale } = useLocale();
  const current = getLevel(count).level;

  return (
    <div className="card-premium p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {t("레벨 사다리", "Level ladder")}
        </h2>
        <span className="text-[11px] uppercase tracking-[0.18em] text-foreground-dim">
          {t("7단계", "7 tiers")}
        </span>
      </div>

      <ol className="flex flex-col">
        {LEVEL_TIERS.map((tier, i) => {
          const next = LEVEL_TIERS[i + 1];
          const range = next
            ? t(`${tier.min}~${next.min - 1}회`, `${tier.min}–${next.min - 1}x`)
            : t(`${tier.min}회+`, `${tier.min}x+`);
          const isCurrent = tier.level === current;
          const isDone = tier.level < current;
          const isUpcoming = tier.level > current;
          const isLast = i === LEVEL_TIERS.length - 1;
          const shimmer = isShimmerLevel(tier.level);
          const shimClass = shimmerClass(tier.level);
          const color = tier.color;

          return (
            <li key={tier.level} className="flex items-stretch gap-3">
              {/* Rail + node */}
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-bold tabular-nums shrink-0 z-10 transition-colors",
                    isUpcoming && !shimmer && "opacity-70",
                  )}
                  style={
                    isCurrent
                      ? {
                          backgroundColor: color,
                          color: "#0a0a0b",
                          boxShadow: `0 0 0 4px ${color}33`,
                        }
                      : shimmer
                        ? {
                            backgroundColor: `${color}26`,
                            boxShadow: `0 0 10px ${color}80`,
                          }
                        : { backgroundColor: `${color}26` }
                  }
                >
                  {isDone ? (
                    <Check size={14} strokeWidth={2.5} style={{ color }} />
                  ) : isCurrent ? (
                    tier.level
                  ) : (
                    <span
                      className={shimClass ?? undefined}
                      style={shimmer ? undefined : { color }}
                    >
                      {tier.level}
                    </span>
                  )}
                </span>
                {!isLast && (
                  <span
                    className="w-0.5 flex-1 my-1 rounded-full"
                    style={{
                      backgroundColor: isDone ? `${color}4d` : "var(--surface-3)",
                    }}
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
                      "text-[14px] truncate",
                      isCurrent ? "font-semibold" : "font-medium",
                      isUpcoming && !shimmer && "opacity-80",
                      shimmer && cn(shimClass, "font-bold"),
                    )}
                    style={shimmer ? undefined : { color }}
                  >
                    {locale === "en" ? tier.titleEn : tier.title}
                  </p>
                  <p className="text-[11px] text-foreground-dim tabular-nums">
                    {range}
                  </p>
                </div>
                {isCurrent && (
                  <span
                    className="shrink-0 text-[10px] font-semibold rounded-full px-2 py-0.5"
                    style={{ backgroundColor: `${color}26`, color }}
                  >
                    {t("현재", "Current")}
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

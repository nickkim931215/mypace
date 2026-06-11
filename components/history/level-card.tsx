"use client";

import { getLevel } from "@/lib/level";

// Level / 칭호 card for the history page. Pure text + XP bar (no character art),
// driven by total finished-workout count.
export function LevelCard({ count }: { count: number }) {
  const lv = getLevel(count);
  const pct = Math.round(lv.progress * 100);
  const barWidth = lv.isMax ? 100 : Math.max(pct, 4);

  return (
    <div className="card-premium p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-accent">
            Level {lv.level}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight truncate">
            {lv.title}
          </h2>
        </div>
        <div className="shrink-0 h-14 w-14 rounded-2xl bg-accent/15 text-accent flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold leading-none tabular-nums">
            {lv.level}
          </span>
          <span className="text-[9px] uppercase tracking-wider mt-0.5">lv</span>
        </div>
      </div>

      {/* XP bar */}
      <div className="mt-5">
        <div className="h-2.5 rounded-full bg-surface-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[12px]">
          {lv.isMax ? (
            <span className="text-accent font-medium">
              최고 레벨 달성 🎉 진정한 최종 병기
            </span>
          ) : (
            <span className="text-foreground-muted truncate">
              다음{" "}
              <span className="text-foreground font-medium">
                {lv.nextTitle}
              </span>
              까지{" "}
              <span className="text-accent font-semibold tabular-nums">
                {lv.toNext}회
              </span>
            </span>
          )}
          <span className="text-foreground-dim tabular-nums shrink-0">
            {lv.isMax ? `${lv.count}회` : `${lv.inTier}/${lv.tierSpan}`}
          </span>
        </div>
      </div>
    </div>
  );
}

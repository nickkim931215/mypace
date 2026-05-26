"use client";

import { cn } from "@/lib/utils";
import { BANNER_PRICING, formatPrice } from "@/lib/inquiry";

const OPTIONS: Array<{ days: 30 | 60 | 90; tag?: string }> = [
  { days: 30 },
  { days: 60, tag: "인기" },
  { days: 90, tag: "최대 할인" },
];

interface Props {
  selected: 30 | 60 | 90;
  onSelect: (days: 30 | 60 | 90) => void;
}

export function PricingTable({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {OPTIONS.map(({ days, tag }) => {
        const active = selected === days;
        const price = BANNER_PRICING[days];
        const perDay = Math.round(price / days);
        return (
          <button
            key={days}
            type="button"
            onClick={() => onSelect(days)}
            className={cn(
              "card-premium relative text-left p-5 transition-all",
              active
                ? "ring-1 ring-accent/60 glow-accent"
                : "hover:translate-y-[-1px] hover:border-border-strong",
            )}
          >
            {tag && (
              <span className="absolute top-4 right-4 text-[10px] uppercase tracking-[0.15em] text-accent">
                {tag}
              </span>
            )}
            <div className="text-[11px] uppercase tracking-[0.2em] text-foreground-dim">
              {days}일
            </div>
            <div className="mt-2 font-display text-2xl font-semibold tracking-tight tabular">
              {formatPrice(price)}
            </div>
            <div className="mt-1 text-[12px] text-foreground-muted tabular">
              일 평균 {formatPrice(perDay)}
            </div>
          </button>
        );
      })}
    </div>
  );
}

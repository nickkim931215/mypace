"use client";

import { cn } from "@/lib/utils";
import { BANNER_PRICING, formatPrice } from "@/lib/inquiry";
import { useT, type TranslateFn } from "@/lib/i18n";

function options(t: TranslateFn): Array<{ days: 30 | 60 | 90; tag?: string }> {
  return [
    { days: 30 },
    { days: 60, tag: t("인기", "Popular") },
    { days: 90, tag: t("최대 할인", "Best value") },
  ];
}

interface Props {
  selected: 30 | 60 | 90;
  onSelect: (days: 30 | 60 | 90) => void;
}

export function PricingTable({ selected, onSelect }: Props) {
  const t = useT();
  const OPTIONS = options(t);
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
              {t(`${days}일`, `${days} days`)}
            </div>
            <div className="mt-2 font-display text-2xl font-semibold tracking-tight tabular">
              {formatPrice(price)}
            </div>
            <div className="mt-1 text-[12px] text-foreground-muted tabular">
              {t("일 평균", "Per day")} {formatPrice(perDay)}
            </div>
          </button>
        );
      })}
    </div>
  );
}

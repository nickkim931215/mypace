"use client";

import { cn } from "@/lib/utils";
import type { BannerSlot } from "@/lib/inquiry";
import { useT } from "@/lib/i18n";

interface Props {
  selected: BannerSlot;
  onSelect: (n: BannerSlot) => void;
}

const SLOTS: BannerSlot[] = [1, 2, 3, 4];

export function BannerSlotPicker({ selected, onSelect }: Props) {
  const t = useT();
  return (
    <div className="grid grid-cols-4 gap-2">
      {SLOTS.map((n) => {
        const active = selected === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            className={cn(
              "h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all",
              active
                ? "bg-accent text-black"
                : "bg-surface-1 border border-border-subtle text-foreground-muted hover:text-foreground hover:border-border-strong",
            )}
          >
            <span className="text-[11px] uppercase tracking-[0.15em] opacity-70">
              {t("배너", "Banner")}
            </span>
            <span className="font-display text-2xl font-semibold tabular">
              {n}
            </span>
          </button>
        );
      })}
    </div>
  );
}

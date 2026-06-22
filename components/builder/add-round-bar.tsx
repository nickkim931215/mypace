"use client";

import { Plus } from "lucide-react";
import { useTimerStore } from "@/store/timer-store";
import { useT } from "@/lib/i18n";

interface Props {
  routineId: string;
}

export function AddRoundBar({ routineId }: Props) {
  const addRound = useTimerStore((s) => s.addRound);
  const t = useT();
  return (
    <div className="grid grid-cols-3 gap-2 mt-2">
      <button
        onClick={() => addRound(routineId, { type: "work" })}
        className="h-12 rounded-2xl border border-dashed border-work/30 text-work/90 hover:bg-work/10 transition-colors inline-flex items-center justify-center gap-1.5 text-[13px] font-medium"
      >
        <Plus size={14} /> {t("운동", "Work")}
      </button>
      <button
        onClick={() => addRound(routineId, { type: "rest" })}
        className="h-12 rounded-2xl border border-dashed border-rest/30 text-rest/90 hover:bg-rest/10 transition-colors inline-flex items-center justify-center gap-1.5 text-[13px] font-medium"
      >
        <Plus size={14} /> {t("휴식", "Rest")}
      </button>
      <button
        onClick={() => addRound(routineId, { type: "prepare" })}
        className="h-12 rounded-2xl border border-dashed border-border-strong text-foreground-muted hover:bg-surface-2 transition-colors inline-flex items-center justify-center gap-1.5 text-[13px] font-medium"
      >
        <Plus size={14} /> {t("준비", "Prepare")}
      </button>
    </div>
  );
}

"use client";

import { Music2, MoreHorizontal } from "lucide-react";
import { useTimerStore, type MetronomeSound } from "@/store/timer-store";
import { cn } from "@/lib/utils";
import { useMetronome } from "@/hooks/use-metronome";
import { useState } from "react";

interface Props {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  enabled: boolean;
  compact?: boolean;
}

const sounds: { key: MetronomeSound; label: string }[] = [
  { key: "wood", label: "Wood" },
  { key: "hihat", label: "Hi-Hat" },
  { key: "click", label: "Click" },
];

export function MetronomePanel({
  bpm,
  onBpmChange,
  enabled,
  compact,
}: Props) {
  const metronomeEnabled = useTimerStore((s) => s.metronomeEnabled);
  const toggleMetronome = useTimerStore((s) => s.toggleMetronome);
  const metronomeSound = useTimerStore((s) => s.metronomeSound);
  const setMetronomeSound = useTimerStore((s) => s.setMetronomeSound);
  const metronomeVolume = useTimerStore((s) => s.metronomeVolume);
  const setMetronomeVolume = useTimerStore((s) => s.setMetronomeVolume);
  const [open, setOpen] = useState(false);

  const active = enabled && metronomeEnabled && bpm > 0;

  const { beat } = useMetronome({
    enabled: active,
    bpm: Math.max(1, bpm),
    sound: metronomeSound,
    volume: metronomeVolume,
  });

  return (
    <div
      className={cn(
        "card-premium p-4 sm:p-5 flex flex-col gap-3",
        compact && "p-3 sm:p-4",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-2xl flex items-center justify-center transition-all",
              metronomeEnabled
                ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                : "bg-surface-2 text-foreground-muted",
            )}
            style={
              metronomeEnabled && active
                ? {
                    transform: `scale(${1 + (beat % 2 === 0 ? 0.08 : 0)})`,
                    transition: "transform 80ms ease-out",
                  }
                : undefined
            }
          >
            <Music2 size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-foreground">
              메트로놈
            </span>
            <span className="text-[11px] text-foreground-dim">
              {metronomeEnabled
                ? bpm > 0
                  ? `${bpm} BPM · ${metronomeSound}`
                  : "BPM을 설정하세요"
                : "꺼짐"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen((o) => !o)}
            className="h-8 w-8 rounded-full text-foreground-dim hover:text-foreground hover:bg-surface-2 flex items-center justify-center"
            aria-label="설정"
          >
            <MoreHorizontal size={16} />
          </button>
          <button
            onClick={toggleMetronome}
            role="switch"
            aria-checked={metronomeEnabled}
            className={cn(
              "h-7 w-12 rounded-full relative transition-colors",
              metronomeEnabled ? "bg-accent" : "bg-surface-3",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                metronomeEnabled ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={40}
          max={200}
          step={1}
          value={bpm || 90}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          disabled={!metronomeEnabled}
          className="flex-1 accent-accent disabled:opacity-40"
        />
        <input
          type="number"
          min={40}
          max={240}
          value={bpm || ""}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          placeholder="90"
          className="tabular w-16 h-9 bg-surface-2 border border-border-subtle rounded-full px-3 text-[13px] text-foreground text-center focus:outline-none focus:border-accent/40"
        />
      </div>

      {open && (
        <div className="flex flex-col gap-3 pt-3 border-t border-border-subtle">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-foreground-dim mb-2">
              사운드
            </div>
            <div className="flex gap-1">
              {sounds.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setMetronomeSound(s.key)}
                  className={cn(
                    "flex-1 h-9 rounded-full text-[12px] font-medium transition-colors",
                    metronomeSound === s.key
                      ? "bg-accent text-black"
                      : "bg-surface-2 text-foreground-muted hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-foreground-dim mb-2 flex justify-between">
              <span>볼륨</span>
              <span className="tabular text-foreground-muted normal-case tracking-normal">
                {Math.round(metronomeVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={metronomeVolume}
              onChange={(e) => setMetronomeVolume(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
}

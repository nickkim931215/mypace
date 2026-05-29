"use client";

import {
  Dumbbell,
  Leaf,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTimerStore } from "@/store/timer-store";
import type { MetronomeSound, SoundTheme } from "@/store/timer-store";
import { audio } from "@/lib/audio";
import { cn } from "@/lib/utils";

const PACKS: {
  id: SoundTheme;
  label: string;
  desc: string;
  Icon: typeof Sparkles;
}[] = [
  { id: "minimal", label: "미니멀", desc: "맑고 깔끔한 사인음", Icon: Sparkles },
  { id: "gym-pro", label: "짐 프로", desc: "강렬한 펀치 톤", Icon: Dumbbell },
  { id: "zen", label: "젠", desc: "부드러운 저음", Icon: Leaf },
];

const METRO: { id: MetronomeSound; label: string }[] = [
  { id: "wood", label: "우드블록" },
  { id: "hihat", label: "하이햇" },
  { id: "click", label: "클릭" },
];

export function SoundSettings() {
  const soundTheme = useTimerStore((s) => s.soundTheme);
  const setSoundTheme = useTimerStore((s) => s.setSoundTheme);
  const metronomeSound = useTimerStore((s) => s.metronomeSound);
  const setMetronomeSound = useTimerStore((s) => s.setMetronomeSound);
  const voiceGuideEnabled = useTimerStore((s) => s.voiceGuideEnabled);
  const setVoiceGuideEnabled = useTimerStore((s) => s.setVoiceGuideEnabled);
  const masterVolume = useTimerStore((s) => s.masterVolume);
  const setMasterVolume = useTimerStore((s) => s.setMasterVolume);

  const pickPack = (id: SoundTheme) => {
    setSoundTheme(id);
    audio.previewTheme(id);
  };

  const pickMetro = (id: MetronomeSound) => {
    setMetronomeSound(id);
    audio.unlock();
    audio.metronomeTick(id, true);
  };

  return (
    <section className="rounded-[var(--radius-card)] bg-surface-1 border border-border-subtle p-5 sm:p-6 flex flex-col gap-6">
      {/* Sound pack */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-medium text-foreground">사운드 팩</span>
          <span className="text-[11px] text-foreground-dim">탭하면 미리듣기</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {PACKS.map(({ id, label, desc, Icon }) => {
            const active = soundTheme === id;
            return (
              <button
                key={id}
                onClick={() => pickPack(id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition-colors",
                  active
                    ? "border-accent bg-accent/10"
                    : "border-border-subtle bg-surface-2 hover:bg-surface-3",
                )}
              >
                <Icon
                  size={18}
                  className={active ? "text-accent" : "text-foreground-muted"}
                />
                <span
                  className={cn(
                    "text-[13px] font-medium",
                    active ? "text-foreground" : "text-foreground-muted",
                  )}
                >
                  {label}
                </span>
                <span className="text-[10px] leading-tight text-foreground-dim">
                  {desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Metronome sound */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-foreground">
          메트로놈 소리
        </span>
        <div className="flex gap-1 rounded-full bg-surface-2 p-1">
          {METRO.map(({ id, label }) => {
            const active = metronomeSound === id;
            return (
              <button
                key={id}
                onClick={() => pickMetro(id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors",
                  active
                    ? "bg-accent text-black"
                    : "text-foreground-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice guide */}
      <button
        onClick={() => setVoiceGuideEnabled(!voiceGuideEnabled)}
        className="flex items-center justify-between gap-3 text-left"
      >
        <span className="text-[13px] font-medium text-foreground">
          음성 안내
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors",
            voiceGuideEnabled
              ? "bg-accent/15 text-accent"
              : "bg-surface-2 text-foreground-dim",
          )}
        >
          {voiceGuideEnabled ? <Mic size={13} /> : <MicOff size={13} />}
          {voiceGuideEnabled ? "켜짐" : "꺼짐"}
        </span>
      </button>

      {/* Master volume */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMasterVolume(masterVolume > 0 ? 0 : 0.8)}
          aria-label="음소거"
          className="text-foreground-dim hover:text-foreground"
        >
          {masterVolume > 0 ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={masterVolume}
          onChange={(e) => setMasterVolume(Number(e.target.value))}
          className="flex-1 accent-accent"
          aria-label="전체 볼륨"
        />
        <span className="tabular text-[12px] text-foreground-dim w-9 text-right">
          {Math.round(masterVolume * 100)}
        </span>
      </div>
    </section>
  );
}

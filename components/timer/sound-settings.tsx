"use client";

import {
  Dumbbell,
  Flame,
  Leaf,
  Mic,
  MicOff,
  Music2,
  Radio,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTimerStore } from "@/store/timer-store";
import type {
  AudioMode,
  MetronomeSound,
  SoundTheme,
} from "@/store/timer-store";
import { BGM_ORDER, BGM_META, FLAVOR_ORDER, FLAVOR_META } from "@/lib/music-tracks";
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

const MODES: { id: AudioMode; label: string; Icon: typeof Music2 }[] = [
  { id: "off", label: "끄기", Icon: VolumeX },
  { id: "metronome", label: "메트로놈", Icon: Music2 },
  { id: "bgm", label: "BGM", Icon: Radio },
  { id: "hype", label: "동기부여", Icon: Flame },
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

  const audioMode = useTimerStore((s) => s.audioMode);
  const setAudioMode = useTimerStore((s) => s.setAudioMode);
  const bgmMood = useTimerStore((s) => s.bgmMood);
  const setBgmMood = useTimerStore((s) => s.setBgmMood);
  const hypeFlavor = useTimerStore((s) => s.hypeFlavor);
  const setHypeFlavor = useTimerStore((s) => s.setHypeFlavor);

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

      {/* In-workout audio mode (matches the run screen — pre-pick it here) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-medium text-foreground">운동 중 오디오</span>
          <span className="text-[11px] text-foreground-dim">운동 시작 때 적용돼요</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {MODES.map(({ id, label, Icon }) => {
            const active = audioMode === id;
            return (
              <button
                key={id}
                onClick={() => setAudioMode(id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl border px-1 py-2.5 transition-colors",
                  active
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border-subtle bg-surface-2 text-foreground-muted hover:bg-surface-3",
                )}
              >
                <Icon
                  size={16}
                  className={active ? "text-accent" : "text-foreground-muted"}
                />
                <span className="text-[12px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Metronome → sound pick (BPM stays per-round in the builder) */}
        {audioMode === "metronome" && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-1 rounded-full bg-surface-2 p-1">
              {METRO.map(({ id, label }) => {
                const active = metronomeSound === id;
                return (
                  <button
                    key={id}
                    onClick={() => pickMetro(id)}
                    className={cn(
                      "flex-1 px-2 py-1.5 rounded-full text-[12px] font-medium transition-colors",
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
            <p className="text-[11px] text-foreground-dim text-center">
              BPM은 각 운동 라운드에서 설정해요
            </p>
          </div>
        )}

        {/* BGM → mood pick */}
        {audioMode === "bgm" && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5">
              {BGM_ORDER.map((m) => {
                const meta = BGM_META[m];
                const active = bgmMood === m;
                return (
                  <button
                    key={m}
                    onClick={() => setBgmMood(m)}
                    className={cn(
                      "flex-1 rounded-2xl px-2 py-2 flex flex-col items-center gap-0.5 border transition-colors",
                      active
                        ? "border-transparent text-black"
                        : "bg-surface-2 border-border-subtle text-foreground-muted hover:text-foreground",
                    )}
                    style={active ? { backgroundColor: meta.accent } : undefined}
                  >
                    <span className="text-base leading-none">{meta.emoji}</span>
                    <span className="text-[12px] font-semibold">{meta.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-foreground-dim text-center">
              {BGM_META[bgmMood].tagline}
            </p>
          </div>
        )}

        {/* Hype → flavor pick */}
        {audioMode === "hype" && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5">
              {FLAVOR_ORDER.map((f) => {
                const meta = FLAVOR_META[f];
                const active = hypeFlavor === f;
                return (
                  <button
                    key={f}
                    onClick={() => setHypeFlavor(f)}
                    className={cn(
                      "flex-1 rounded-2xl px-2 py-2 flex flex-col items-center gap-0.5 border transition-colors",
                      active
                        ? "border-transparent text-black"
                        : "bg-surface-2 border-border-subtle text-foreground-muted hover:text-foreground",
                    )}
                    style={active ? { backgroundColor: meta.accent } : undefined}
                  >
                    <span className="text-base leading-none">{meta.emoji}</span>
                    <span className="text-[12px] font-semibold">{meta.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-foreground-dim text-center">
              {FLAVOR_META[hypeFlavor].tagline}
            </p>
          </div>
        )}
      </div>

      {/* Voice guide — always available */}
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

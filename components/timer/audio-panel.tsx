"use client";

import { useEffect, useState } from "react";
import { Music2, Radio, Flame, VolumeX, SkipForward, Loader2 } from "lucide-react";
import {
  useTimerStore,
  type AudioMode,
  type MetronomeSound,
} from "@/store/timer-store";
import { cn } from "@/lib/utils";
import { useMetronome } from "@/hooks/use-metronome";
import { musicPlayer, type MusicPlayerState } from "@/lib/music-player";
import {
  BGM_ORDER,
  BGM_META,
  FLAVOR_ORDER,
  FLAVOR_META,
  bgmTracksFor,
  tracksFor,
} from "@/lib/music-tracks";

interface Props {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  isWorkRound: boolean;
  isRunning: boolean;
}

const MODES: { key: AudioMode; label: string; icon: typeof Music2 }[] = [
  { key: "off", label: "끄기", icon: VolumeX },
  { key: "metronome", label: "메트로놈", icon: Music2 },
  { key: "bgm", label: "BGM", icon: Radio },
  { key: "hype", label: "동기부여", icon: Flame },
];

const sounds: { key: MetronomeSound; label: string }[] = [
  { key: "wood", label: "Wood" },
  { key: "hihat", label: "Hi-Hat" },
  { key: "click", label: "Click" },
];

export function AudioPanel({ bpm, onBpmChange, isWorkRound, isRunning }: Props) {
  const audioMode = useTimerStore((s) => s.audioMode);
  const setAudioMode = useTimerStore((s) => s.setAudioMode);

  return (
    <div className="card-premium p-3 sm:p-4 flex flex-col gap-3">
      {/* Mode selector */}
      <div className="flex gap-1">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = audioMode === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setAudioMode(m.key)}
              className={cn(
                "flex-1 h-9 rounded-full text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors",
                active
                  ? "bg-accent text-black"
                  : "bg-surface-2 text-foreground-muted hover:text-foreground",
              )}
            >
              <Icon size={14} />
              {m.label}
            </button>
          );
        })}
      </div>

      {audioMode === "metronome" && (
        <MetronomeControls
          bpm={bpm}
          onBpmChange={onBpmChange}
          active={isWorkRound && isRunning}
        />
      )}
      {audioMode === "bgm" && <BgmControls />}
      {audioMode === "hype" && <HypeControls />}
    </div>
  );
}

/* ─── Metronome ──────────────────────────────────────────────── */
function MetronomeControls({
  bpm,
  onBpmChange,
  active,
}: {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  active: boolean;
}) {
  const metronomeSound = useTimerStore((s) => s.metronomeSound);
  const setMetronomeSound = useTimerStore((s) => s.setMetronomeSound);
  const metronomeVolume = useTimerStore((s) => s.metronomeVolume);
  const setMetronomeVolume = useTimerStore((s) => s.setMetronomeVolume);

  useMetronome({
    enabled: active && bpm > 0,
    bpm: Math.max(1, bpm),
    sound: metronomeSound,
    volume: metronomeVolume,
  });

  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={40}
          max={200}
          step={1}
          value={bpm || 90}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="flex-1 accent-accent"
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
      <div className="flex gap-1">
        {sounds.map((s) => (
          <button
            key={s.key}
            onClick={() => setMetronomeSound(s.key)}
            className={cn(
              "flex-1 h-8 rounded-full text-[12px] font-medium transition-colors",
              metronomeSound === s.key
                ? "bg-accent text-black"
                : "bg-surface-2 text-foreground-muted hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <VolumeRow
        label="볼륨"
        value={metronomeVolume}
        onChange={setMetronomeVolume}
      />
      {!(active && bpm > 0) && (
        <p className="text-[11px] text-foreground-dim text-center">
          {bpm > 0 ? "운동 라운드에서 박자가 울립니다" : "BPM을 설정하세요"}
        </p>
      )}
    </div>
  );
}

/* ─── BGM (instrumental, no lyrics) ──────────────────────────── */
function BgmControls() {
  const bgmMood = useTimerStore((s) => s.bgmMood);
  const setBgmMood = useTimerStore((s) => s.setBgmMood);
  const musicVolume = useTimerStore((s) => s.musicVolume);
  const setMusicVolume = useTimerStore((s) => s.setMusicVolume);

  const [state, setState] = useState<MusicPlayerState>({
    status: "idle",
    current: null,
  });
  useEffect(() => musicPlayer.subscribe(setState), []);

  const count = bgmTracksFor(bgmMood).length;

  return (
    <div className="flex flex-col gap-3 pt-1">
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

      {count > 0 ? (
        <PlayingRow state={state} icon={Radio} />
      ) : (
        <StatusBox
          title="기본 멜로디 재생 중"
          subtitle="가사 없는 음원을 올리면 교체됩니다"
        />
      )}

      <VolumeRow label="볼륨" value={musicVolume} onChange={setMusicVolume} />
    </div>
  );
}

/* ─── Hype (motivational vocal tracks) ───────────────────────── */
function HypeControls() {
  const hypeFlavor = useTimerStore((s) => s.hypeFlavor);
  const setHypeFlavor = useTimerStore((s) => s.setHypeFlavor);
  const musicVolume = useTimerStore((s) => s.musicVolume);
  const setMusicVolume = useTimerStore((s) => s.setMusicVolume);

  const [state, setState] = useState<MusicPlayerState>({
    status: "idle",
    current: null,
  });
  useEffect(() => musicPlayer.subscribe(setState), []);

  const count = tracksFor(hypeFlavor).length;

  return (
    <div className="flex flex-col gap-3 pt-1">
      {/* Flavor picker */}
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

      {/* Now playing / empty state */}
      {count > 0 ? (
        <PlayingRow state={state} icon={Flame} />
      ) : (
        <StatusBox
          title={`${FLAVOR_META[hypeFlavor].label} 음원 준비 중 🎵`}
          subtitle="곧 추가됩니다"
        />
      )}

      <VolumeRow label="볼륨" value={musicVolume} onChange={setMusicVolume} />
    </div>
  );
}

/* ─── Shared: now-playing row + status box ───────────────────── */
function PlayingRow({
  state,
  icon: Icon,
}: {
  state: MusicPlayerState;
  icon: typeof Flame;
}) {
  const loading = state.status === "loading";
  const title = state.current?.title ?? "대기 중";
  return (
    <div className="rounded-2xl bg-surface-2 px-3 py-2.5 flex items-center gap-3">
      <div className="h-8 w-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Icon size={15} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-[0.16em] text-foreground-dim">
          {state.status === "playing"
            ? "재생 중"
            : state.status === "paused"
              ? "일시정지"
              : "재생 대기"}
        </p>
        <p className="text-[13px] font-medium text-foreground truncate">
          {title}
        </p>
      </div>
      <button
        onClick={() => musicPlayer.next()}
        className="h-8 w-8 rounded-full text-foreground-muted hover:text-foreground hover:bg-surface-3 flex items-center justify-center shrink-0"
        aria-label="다음 곡"
      >
        <SkipForward size={16} />
      </button>
    </div>
  );
}

function StatusBox({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-3 py-2.5 text-center">
      <p className="text-[12px] text-foreground-muted">{title}</p>
      <p className="text-[11px] text-foreground-dim mt-0.5">{subtitle}</p>
    </div>
  );
}

/* ─── Shared volume row ──────────────────────────────────────── */
function VolumeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.16em] text-foreground-dim mb-1.5 flex justify-between">
        <span>{label}</span>
        <span className="tabular text-foreground-muted normal-case tracking-normal">
          {Math.round(value * 100)}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}

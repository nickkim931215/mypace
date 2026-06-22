"use client";

import { useEffect, useState } from "react";
import { Music2, Radio, Flame, VolumeX, SkipForward, Loader2 } from "lucide-react";
import {
  useTimerStore,
  type AudioMode,
  type MetronomeSound,
} from "@/store/timer-store";
import { cn } from "@/lib/utils";
import { useT, useLocale, type TranslateFn } from "@/lib/i18n";
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

const modesFor = (
  t: TranslateFn,
): { key: AudioMode; label: string; icon: typeof Music2 }[] => [
  { key: "off", label: t("끄기", "Off"), icon: VolumeX },
  { key: "metronome", label: t("메트로놈", "Metronome"), icon: Music2 },
  { key: "bgm", label: "BGM", icon: Radio },
  { key: "hype", label: t("동기부여", "Hype"), icon: Flame },
];

const sounds: { key: MetronomeSound; label: string }[] = [
  { key: "wood", label: "Wood" },
  { key: "hihat", label: "Hi-Hat" },
  { key: "click", label: "Click" },
];

export function AudioPanel({ bpm, onBpmChange, isWorkRound, isRunning }: Props) {
  const t = useT();
  const audioMode = useTimerStore((s) => s.audioMode);
  const setAudioMode = useTimerStore((s) => s.setAudioMode);
  const MODES = modesFor(t);

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
  const t = useT();

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
        label={t("볼륨", "Volume")}
        value={metronomeVolume}
        onChange={setMetronomeVolume}
      />
      {!(active && bpm > 0) && (
        <p className="text-[11px] text-foreground-dim text-center">
          {bpm > 0
            ? t("운동 라운드에서 박자가 울립니다", "The beat plays during work rounds")
            : t("BPM을 설정하세요", "Set a BPM")}
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
  const t = useT();
  const { locale } = useLocale();

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
              <span className="text-[12px] font-semibold">
                {locale === "en" ? meta.labelEn : meta.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-foreground-dim text-center">
        {locale === "en"
          ? BGM_META[bgmMood].taglineEn
          : BGM_META[bgmMood].tagline}
      </p>

      {count > 0 ? (
        <PlayingRow state={state} icon={Radio} />
      ) : (
        <StatusBox
          title={t("기본 멜로디 재생 중", "Playing default melody")}
          subtitle={t(
            "가사 없는 음원을 올리면 교체됩니다",
            "Upload instrumental tracks to replace it",
          )}
        />
      )}

      <VolumeRow
        label={t("볼륨", "Volume")}
        value={musicVolume}
        onChange={setMusicVolume}
      />
    </div>
  );
}

/* ─── Hype (motivational vocal tracks) ───────────────────────── */
function HypeControls() {
  const hypeFlavor = useTimerStore((s) => s.hypeFlavor);
  const setHypeFlavor = useTimerStore((s) => s.setHypeFlavor);
  const musicVolume = useTimerStore((s) => s.musicVolume);
  const setMusicVolume = useTimerStore((s) => s.setMusicVolume);
  const t = useT();
  const { locale } = useLocale();

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
              <span className="text-[12px] font-semibold">
                {locale === "en" ? meta.labelEn : meta.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-foreground-dim text-center">
        {locale === "en"
          ? FLAVOR_META[hypeFlavor].taglineEn
          : FLAVOR_META[hypeFlavor].tagline}
      </p>

      {/* Now playing / empty state */}
      {count > 0 ? (
        <PlayingRow state={state} icon={Flame} />
      ) : (
        <StatusBox
          title={
            locale === "en"
              ? `${FLAVOR_META[hypeFlavor].labelEn} tracks coming soon 🎵`
              : `${FLAVOR_META[hypeFlavor].label} 음원 준비 중 🎵`
          }
          subtitle={t("곧 추가됩니다", "Coming soon")}
        />
      )}

      <VolumeRow
        label={t("볼륨", "Volume")}
        value={musicVolume}
        onChange={setMusicVolume}
      />
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
  const t = useT();
  const loading = state.status === "loading";
  const title = state.current?.title ?? t("대기 중", "Waiting");
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
            ? t("재생 중", "Playing")
            : state.status === "paused"
              ? t("일시정지", "Paused")
              : t("재생 대기", "Ready")}
        </p>
        <p className="text-[13px] font-medium text-foreground truncate">
          {title}
        </p>
      </div>
      <button
        onClick={() => musicPlayer.next()}
        className="h-8 w-8 rounded-full text-foreground-muted hover:text-foreground hover:bg-surface-3 flex items-center justify-center shrink-0"
        aria-label={t("다음 곡", "Next track")}
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

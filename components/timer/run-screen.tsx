"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Star,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTimerStore } from "@/store/timer-store";
import { useTimerEngine } from "@/hooks/use-timer-engine";
import { audio } from "@/lib/audio";
import { ProgressRing } from "./progress-ring";
import { AudioPanel } from "./audio-panel";
import { useWorkoutAudio } from "@/hooks/use-workout-audio";
import { formatClock, cn } from "@/lib/utils";
import type { Routine } from "@/lib/types";

interface Props {
  routine: Routine;
}

export function RunScreen({ routine }: Props) {
  const router = useRouter();
  const masterVolume = useTimerStore((s) => s.masterVolume);
  const setMasterVolume = useTimerStore((s) => s.setMasterVolume);
  const timerVolume = useTimerStore((s) => s.timerVolume);
  const metronomeVolume = useTimerStore((s) => s.metronomeVolume);
  const musicVolume = useTimerStore((s) => s.musicVolume);
  const audioMode = useTimerStore((s) => s.audioMode);
  const bgmMood = useTimerStore((s) => s.bgmMood);
  const hypeFlavor = useTimerStore((s) => s.hypeFlavor);
  const uiVolume = useTimerStore((s) => s.uiVolume);
  const soundTheme = useTimerStore((s) => s.soundTheme);
  const voiceGuideEnabled = useTimerStore((s) => s.voiceGuideEnabled);
  const setVoiceGuideEnabled = useTimerStore((s) => s.setVoiceGuideEnabled);

  // Sync audio engine
  useEffect(() => {
    audio.setVolumes({
      master: masterVolume,
      timer: timerVolume,
      metronome: metronomeVolume,
      ui: uiVolume,
    });
    audio.setTheme(soundTheme);
  }, [masterVolume, timerVolume, metronomeVolume, uiVolume, soundTheme]);

  const { snapshot, start, pause, resume, skip, prev, reset } =
    useTimerEngine({
      routine,
      voiceGuideEnabled,
    });

  const [hasStarted, setHasStarted] = useState(false);

  // Responsive ring sizing. The ring used to be a fixed 340px; on small phones
  // (and once a work round shows the metronome panel) that pushed the transport
  // controls — including the play button — below the visible viewport. We size
  // the ring from the available viewport so everything always fits, in both
  // portrait and landscape. Reserve enough for the worst case (metronome shown)
  // so the ring doesn't jump when the round type changes mid-run.
  const [ringSize, setRingSize] = useState(300);
  useEffect(() => {
    const compute = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      // Reserves include slack for safe-area insets (notch / home indicator).
      const TOP_RESERVE = 100; // top bar + padding + status bar inset
      const CENTER_EXTRAS = 96; // round badge + "다음 —" label
      const BOTTOM_RESERVE = 256; // metronome panel + transport + paddings + inset
      const byHeight = vh - TOP_RESERVE - CENTER_EXTRAS - BOTTOM_RESERVE;
      const byWidth = vw - 48;
      setRingSize(Math.max(150, Math.min(340, byHeight, byWidth)));
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, []);
  const numberFontSize = Math.round(ringSize * 0.34);
  // The round name ("운동 이름" / "Rest") used to be a flat 13px, which looked
  // tiny next to the huge timer number. Scale it from the ring too so it stays
  // legible at a glance during a workout.
  const nameFontSize = Math.round(ringSize * 0.085);

  const isWork = snapshot.currentRound?.type === "work";
  const isRest = snapshot.currentRound?.type === "rest";

  // Drive BGM / hype music off the run state (metronome is handled in-panel).
  useWorkoutAudio({
    audioMode,
    bgmMood,
    hypeFlavor,
    status: snapshot.status,
    masterVolume,
    musicVolume,
  });

  const ringColor = isWork
    ? "var(--accent)"
    : isRest
      ? "var(--rest)"
      : "var(--foreground-muted)";

  const progress = snapshot.roundDurationMs
    ? snapshot.elapsedRoundMs / snapshot.roundDurationMs
    : 0;
  const secondsLeft = Math.ceil(snapshot.remainingMs / 1000);
  const pulse = secondsLeft <= 3 && secondsLeft > 0 && snapshot.status === "running";

  // Auto-start on mount (first user gesture happened on click "시작")
  useEffect(() => {
    audio.unlock();
  }, []);

  const handleStart = () => {
    audio.unlock();
    setHasStarted(true);
    start();
  };

  const exit = () => {
    reset();
    router.push("/timer");
  };

  // Count a completion exactly once when the run finishes.
  const markRoutineCompleted = useTimerStore((s) => s.markRoutineCompleted);
  const completedRef = useRef(false);
  useEffect(() => {
    if (snapshot.status === "finished" && !completedRef.current) {
      completedRef.current = true;
      markRoutineCompleted(routine.id);
    } else if (snapshot.status !== "finished") {
      completedRef.current = false;
    }
  }, [snapshot.status, markRoutineCompleted, routine.id]);

  // Update BPM live for current round
  const updateRound = useTimerStore((s) => s.updateRound);
  const currentRoundBpm = snapshot.currentRound?.bpm ?? 0;

  const totalElapsedLabel = formatClock(snapshot.totalElapsedMs / 1000);
  const totalDurationLabel = formatClock(snapshot.totalDurationMs / 1000);

  // Subtle screen-edge pulse during last-3-seconds
  const edgeGlow = useMemo(() => {
    if (!pulse) return "transparent";
    return isWork ? "rgba(212,255,63,0.18)" : "rgba(59,130,246,0.18)";
  }, [pulse, isWork]);

  if (snapshot.status === "finished") {
    return (
      <FinishedScreen
        routine={routine}
        onRestart={() => {
          reset();
          handleStart();
        }}
        onExit={exit}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-background text-foreground flex flex-col"
      style={{
        boxShadow: pulse
          ? `inset 0 0 200px 20px ${edgeGlow}`
          : "inset 0 0 0 0 transparent",
        transition: "box-shadow 200ms ease",
      }}
    >
      {/* Top bar — pad for the status-bar / notch (viewportFit: cover). */}
      <div className="flex items-center justify-between px-5 sm:px-8 pt-[max(1.25rem,env(safe-area-inset-top))] sm:pt-[max(1.75rem,env(safe-area-inset-top))]">
        <button
          onClick={exit}
          className="h-10 w-10 rounded-full bg-surface-1 hover:bg-surface-2 border border-border-subtle flex items-center justify-center text-foreground-muted"
          aria-label="닫기"
        >
          <X size={18} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[11px] uppercase tracking-[0.2em] text-foreground-dim">
            {routine.name}
          </span>
          <span className="tabular text-[13px] text-foreground-muted">
            {totalElapsedLabel} / {totalDurationLabel}
          </span>
        </div>
        <button
          onClick={() => setVoiceGuideEnabled(!voiceGuideEnabled)}
          className={cn(
            "h-10 w-10 rounded-full border border-border-subtle flex items-center justify-center transition-colors",
            voiceGuideEnabled
              ? "bg-surface-1 text-foreground-muted"
              : "bg-surface-1 text-foreground-dim",
          )}
          aria-label="음성 안내"
        >
          {voiceGuideEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* Main center */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-5">
        {/* Round badge */}
        <motion.div
          key={snapshot.roundIdx + snapshot.repeatIdx * 100}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-2 mb-5"
        >
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em]",
              isWork
                ? "text-accent"
                : isRest
                  ? "text-rest"
                  : "text-foreground-dim",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isWork
                  ? "bg-accent"
                  : isRest
                    ? "bg-rest"
                    : "bg-foreground-dim",
              )}
            />
            {snapshot.currentRound?.type === "rest"
              ? "Rest"
              : snapshot.currentRound?.type === "prepare"
                ? "Get Ready"
                : "Work"}
            <span className="text-foreground-dim">
              · {snapshot.roundIdx + 1} / {routine.rounds.length}
            </span>
            {routine.repeat > 1 && (
              <span className="text-foreground-dim">
                · 라운드 {snapshot.repeatIdx + 1} / {routine.repeat}
              </span>
            )}
          </span>
        </motion.div>

        {/* Progress ring + huge number */}
        <ProgressRing
          progress={progress}
          color={ringColor}
          size={ringSize}
          strokeWidth={8}
        >
          <div className="flex flex-col items-center px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={snapshot.currentRound?.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                style={{ fontSize: nameFontSize }}
                className="font-medium text-foreground truncate max-w-[80%] text-center leading-tight"
              >
                {snapshot.currentRound?.name ?? "—"}
              </motion.div>
            </AnimatePresence>
            <motion.div
              key={secondsLeft + "-num"}
              initial={pulse ? { scale: 1.18 } : { scale: 1 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 16 }}
              style={{ fontSize: numberFontSize }}
              className="tabular font-display font-semibold leading-none tracking-[-0.05em] mt-1 text-foreground"
            >
              {formatClock(snapshot.remainingMs / 1000)}
            </motion.div>
          </div>
        </ProgressRing>

        {/* Next */}
        <div className="mt-8 text-[13px] text-foreground-muted text-center min-h-[20px]">
          {snapshot.nextRound ? (
            <>
              <span className="text-foreground-dim">다음 — </span>
              <span className="text-foreground-muted">
                {snapshot.nextRound.name}
              </span>
              <span className="text-foreground-dim">
                {" "}
                · {snapshot.nextRound.durationSec}초
              </span>
            </>
          ) : (
            <span className="text-foreground-dim">마지막 라운드</span>
          )}
        </div>
      </div>

      {/* Bottom — pad for the home indicator / gesture bar (viewportFit: cover). */}
      <div className="px-5 sm:px-8 pb-[max(1.75rem,env(safe-area-inset-bottom))] sm:pb-[max(2.5rem,env(safe-area-inset-bottom))] flex flex-col gap-4">
        {/* Audio: metronome / BGM / hype music (exclusive) */}
        <AudioPanel
          bpm={currentRoundBpm}
          onBpmChange={(bpm) =>
            snapshot.currentRound &&
            updateRound(routine.id, snapshot.currentRound.id, { bpm })
          }
          isWorkRound={isWork}
          isRunning={snapshot.status === "running"}
        />

        {/* Master volume + transport */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 flex-1 max-w-[200px]">
            <Volume2 size={16} className="text-foreground-dim" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={masterVolume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              className="flex-1 accent-accent"
            />
          </div>

          <div className="flex-1 flex items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={prev}
              disabled={snapshot.status === "idle"}
              className="h-12 w-12 rounded-full bg-surface-1 hover:bg-surface-2 border border-border-subtle disabled:opacity-40 flex items-center justify-center text-foreground-muted"
              aria-label="이전"
            >
              <SkipBack size={18} />
            </button>

            {snapshot.status === "running" ? (
              <button
                onClick={pause}
                className="h-16 w-16 rounded-full bg-accent text-black flex items-center justify-center glow-accent active:scale-95 transition-transform"
                aria-label="일시정지"
              >
                <Pause size={22} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={() =>
                  !hasStarted
                    ? handleStart()
                    : snapshot.status === "paused"
                      ? resume()
                      : handleStart()
                }
                className="h-16 w-16 rounded-full bg-accent text-black flex items-center justify-center glow-accent active:scale-95 transition-transform"
                aria-label="재생"
              >
                <Play size={22} fill="currentColor" />
              </button>
            )}

            <button
              onClick={skip}
              disabled={snapshot.status === "idle"}
              className="h-12 w-12 rounded-full bg-surface-1 hover:bg-surface-2 border border-border-subtle disabled:opacity-40 flex items-center justify-center text-foreground-muted"
              aria-label="다음"
            >
              <SkipForward size={18} />
            </button>
          </div>

          <div className="hidden sm:block flex-1 max-w-[200px]" />
        </div>
      </div>
    </div>
  );
}

function FinishedScreen({
  routine,
  onRestart,
  onExit,
}: {
  routine: Routine;
  onRestart: () => void;
  onExit: () => void;
}) {
  const rateRoutine = useTimerStore((s) => s.rateRoutine);
  const savedRating = useTimerStore(
    (s) => s.routines.find((r) => r.id === routine.id)?.rating,
  );
  const [hovered, setHovered] = useState(0);

  const handleRate = (n: number) => {
    rateRoutine(routine.id, n);
    audio.unlock();
    audio.uiSuccess();
  };

  const shown = hovered || savedRating || 0;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto overscroll-contain">
      <div className="min-h-full flex flex-col items-center justify-center text-center px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className="h-20 w-20 rounded-full bg-accent flex items-center justify-center mb-7 shrink-0"
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="black"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="5 13 9 17 19 7" />
        </svg>
      </motion.div>
      <h1 className="font-display text-4xl sm:text-5xl tracking-[-0.03em] font-semibold">
        수고하셨습니다
      </h1>
      <p className="mt-3 text-foreground-muted text-[15px]">
        {routine.name} · {formatClock(routine.totalDurationSec * routine.repeat)}{" "}
        완료
      </p>

      {/* Star rating — rate this routine 1–5 stars. Saved immediately. */}
      <div className="mt-9 flex flex-col items-center gap-2">
        <span className="text-[12px] uppercase tracking-[0.18em] text-foreground-dim">
          이 루틴 평가
        </span>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              data-no-sound
              onClick={() => handleRate(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${n}점`}
              className="p-1 active:scale-90 transition-transform"
            >
              <Star
                size={32}
                className={cn(
                  "transition-colors",
                  n <= shown
                    ? "text-accent fill-accent"
                    : "text-surface-3 fill-surface-3",
                )}
              />
            </button>
          ))}
        </div>
        <span className="h-5 text-[13px] text-foreground-muted">
          {savedRating ? `${savedRating}점으로 저장됨 ✓` : "별을 눌러 평가하세요"}
        </span>
      </div>

      <div className="mt-9 flex items-center gap-3 shrink-0">
        <button
          onClick={onRestart}
          className="h-12 px-6 rounded-full bg-accent text-black font-medium"
        >
          한 번 더
        </button>
        <button
          onClick={onExit}
          className="h-12 px-6 rounded-full bg-surface-1 border border-border-subtle text-foreground"
        >
          종료
        </button>
      </div>

      <Link
        href="/history"
        className="mt-6 text-[13px] text-foreground-muted hover:text-accent transition-colors"
      >
        내 기록 보기 →
      </Link>
      </div>
    </div>
  );
}

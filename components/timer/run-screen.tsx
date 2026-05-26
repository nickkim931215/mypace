"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTimerStore } from "@/store/timer-store";
import { useTimerEngine } from "@/hooks/use-timer-engine";
import { audio } from "@/lib/audio";
import { ProgressRing } from "./progress-ring";
import { MetronomePanel } from "./metronome-panel";
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

  const isWork = snapshot.currentRound?.type === "work";
  const isRest = snapshot.currentRound?.type === "rest";

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
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 sm:px-8 pt-5 sm:pt-7">
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
      <div className="flex-1 flex flex-col items-center justify-center px-5">
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
          size={340}
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
                className="text-[13px] text-foreground-muted truncate max-w-[200px] text-center"
              >
                {snapshot.currentRound?.name ?? "—"}
              </motion.div>
            </AnimatePresence>
            <motion.div
              key={secondsLeft + "-num"}
              initial={pulse ? { scale: 1.18 } : { scale: 1 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 16 }}
              className="tabular font-display font-semibold text-[88px] sm:text-[120px] leading-none tracking-[-0.05em] mt-1 text-foreground"
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

      {/* Bottom */}
      <div className="px-5 sm:px-8 pb-7 sm:pb-10 flex flex-col gap-4">
        {/* Metronome */}
        {snapshot.currentRound?.type === "work" && (
          <MetronomePanel
            bpm={currentRoundBpm}
            onBpmChange={(bpm) =>
              snapshot.currentRound &&
              updateRound(routine.id, snapshot.currentRound.id, { bpm })
            }
            enabled
            compact
          />
        )}

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
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center text-center px-6">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className="h-20 w-20 rounded-full bg-accent flex items-center justify-center mb-7"
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
      <div className="mt-10 flex items-center gap-3">
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
    </div>
  );
}

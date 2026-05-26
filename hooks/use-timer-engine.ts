"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Round, Routine } from "@/lib/types";
import { audio, speak } from "@/lib/audio";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

export interface TimerSnapshot {
  status: TimerStatus;
  roundIdx: number;
  repeatIdx: number;
  totalRepeats: number;
  currentRound: Round | null;
  nextRound: Round | null;
  remainingMs: number;
  elapsedRoundMs: number;
  roundDurationMs: number;
  totalRemainingMs: number;
  totalElapsedMs: number;
  totalDurationMs: number;
}

interface UseTimerOptions {
  routine: Routine;
  voiceGuideEnabled?: boolean;
  onFinish?: () => void;
}

const emptySnapshot = (): TimerSnapshot => ({
  status: "idle",
  roundIdx: 0,
  repeatIdx: 0,
  totalRepeats: 1,
  currentRound: null,
  nextRound: null,
  remainingMs: 0,
  elapsedRoundMs: 0,
  roundDurationMs: 0,
  totalRemainingMs: 0,
  totalElapsedMs: 0,
  totalDurationMs: 0,
});

export function useTimerEngine({
  routine,
  voiceGuideEnabled = true,
  onFinish,
}: UseTimerOptions) {
  // Flatten routine into a played sequence (repeat * rounds)
  const sequence = useMemo(() => {
    const seq: Round[] = [];
    for (let r = 0; r < routine.repeat; r++) seq.push(...routine.rounds);
    return seq;
  }, [routine]);

  const totalDurationMs = useMemo(
    () => sequence.reduce((acc, r) => acc + r.durationSec * 1000, 0),
    [sequence],
  );

  // Cumulative offsets for each round in the sequence
  const offsets = useMemo(() => {
    const arr: number[] = [];
    let acc = 0;
    for (const r of sequence) {
      arr.push(acc);
      acc += r.durationSec * 1000;
    }
    return arr;
  }, [sequence]);

  const [status, setStatus] = useState<TimerStatus>("idle");
  const [tick, setTick] = useState(0);

  // Refs: time anchors
  const startedAtRef = useRef<number>(0); // performance.now() when current segment started
  const pausedElapsedRef = useRef<number>(0); // elapsed when paused
  const currentIdxRef = useRef<number>(0);
  const lastCountdownRef = useRef<number>(-1);
  const rafRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const playRoundStartSound = useCallback(
    (round: Round) => {
      if (round.type === "rest") audio.restStart();
      else audio.roundStart();
      if (voiceGuideEnabled) speak(round.name);
    },
    [voiceGuideEnabled],
  );

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setStatus("finished");
    audio.workoutComplete();
    if (voiceGuideEnabled) speak("운동 완료! 수고하셨습니다");
    onFinish?.();
  }, [onFinish, voiceGuideEnabled]);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const loop = useCallback(() => {
    const now = performance.now();
    const seg = sequence[currentIdxRef.current];
    if (!seg) {
      finish();
      stopLoop();
      return;
    }
    const segDurationMs = seg.durationSec * 1000;
    const segElapsed = now - startedAtRef.current;
    const segRemaining = segDurationMs - segElapsed;

    // Countdown beeps at 3, 2, 1 second remaining (for active rounds)
    const secLeft = Math.ceil(segRemaining / 1000);
    if (
      secLeft <= 3 &&
      secLeft >= 1 &&
      secLeft !== lastCountdownRef.current &&
      segDurationMs >= 4000
    ) {
      lastCountdownRef.current = secLeft;
      audio.countdown(secLeft as 1 | 2 | 3);
    }

    if (segRemaining <= 0) {
      // Advance
      audio.roundEnd();
      currentIdxRef.current += 1;
      lastCountdownRef.current = -1;
      const nextSeg = sequence[currentIdxRef.current];
      if (!nextSeg) {
        finish();
        stopLoop();
        return;
      }
      startedAtRef.current = now; // exact handoff
      playRoundStartSound(nextSeg);
    }
    setTick((t) => (t + 1) % 1_000_000);
    rafRef.current = requestAnimationFrame(loop);
  }, [sequence, finish, stopLoop, playRoundStartSound]);

  const start = useCallback(() => {
    audio.unlock();
    finishedRef.current = false;
    currentIdxRef.current = 0;
    lastCountdownRef.current = -1;
    pausedElapsedRef.current = 0;
    startedAtRef.current = performance.now();
    setStatus("running");
    const first = sequence[0];
    if (first) playRoundStartSound(first);
    rafRef.current = requestAnimationFrame(loop);
  }, [sequence, loop, playRoundStartSound]);

  const pause = useCallback(() => {
    if (status !== "running") return;
    pausedElapsedRef.current = performance.now() - startedAtRef.current;
    setStatus("paused");
    stopLoop();
  }, [status, stopLoop]);

  const resume = useCallback(() => {
    if (status !== "paused") return;
    startedAtRef.current = performance.now() - pausedElapsedRef.current;
    setStatus("running");
    rafRef.current = requestAnimationFrame(loop);
  }, [status, loop]);

  const skip = useCallback(() => {
    if (status === "finished") return;
    audio.uiTap();
    currentIdxRef.current += 1;
    lastCountdownRef.current = -1;
    const next = sequence[currentIdxRef.current];
    if (!next) {
      finish();
      stopLoop();
      return;
    }
    startedAtRef.current = performance.now();
    pausedElapsedRef.current = 0;
    playRoundStartSound(next);
    if (status === "paused") setStatus("running");
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(loop);
  }, [sequence, status, finish, stopLoop, playRoundStartSound, loop]);

  const prev = useCallback(() => {
    if (status === "idle") return;
    audio.uiTap();
    currentIdxRef.current = Math.max(0, currentIdxRef.current - 1);
    lastCountdownRef.current = -1;
    startedAtRef.current = performance.now();
    pausedElapsedRef.current = 0;
    const cur = sequence[currentIdxRef.current];
    if (cur) playRoundStartSound(cur);
    finishedRef.current = false;
    if (status !== "running") setStatus("running");
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(loop);
  }, [sequence, status, playRoundStartSound, loop]);

  const reset = useCallback(() => {
    stopLoop();
    currentIdxRef.current = 0;
    lastCountdownRef.current = -1;
    pausedElapsedRef.current = 0;
    startedAtRef.current = 0;
    finishedRef.current = false;
    setStatus("idle");
  }, [stopLoop]);

  // Cleanup on unmount
  useEffect(() => stopLoop, [stopLoop]);

  // Snapshot derived state (recomputed each rAF tick)
  const snapshot: TimerSnapshot = useMemo(() => {
    void tick; // depend on tick
    if (status === "idle" || sequence.length === 0) {
      return {
        ...emptySnapshot(),
        totalRepeats: routine.repeat,
        totalDurationMs,
        currentRound: sequence[0] ?? null,
        nextRound: sequence[1] ?? null,
        roundDurationMs: (sequence[0]?.durationSec ?? 0) * 1000,
        remainingMs: (sequence[0]?.durationSec ?? 0) * 1000,
        totalRemainingMs: totalDurationMs,
      };
    }
    const idx = currentIdxRef.current;
    const seg = sequence[idx];
    if (!seg) {
      return {
        ...emptySnapshot(),
        status: "finished",
        totalRepeats: routine.repeat,
        totalDurationMs,
        totalElapsedMs: totalDurationMs,
      };
    }
    const segDurationMs = seg.durationSec * 1000;
    const segElapsed =
      status === "paused"
        ? pausedElapsedRef.current
        : performance.now() - startedAtRef.current;
    const elapsedClamped = Math.min(segDurationMs, Math.max(0, segElapsed));
    const remaining = Math.max(0, segDurationMs - elapsedClamped);
    const totalElapsed = offsets[idx] + elapsedClamped;
    const totalRemaining = Math.max(0, totalDurationMs - totalElapsed);
    return {
      status,
      roundIdx: idx % routine.rounds.length,
      repeatIdx: Math.floor(idx / routine.rounds.length),
      totalRepeats: routine.repeat,
      currentRound: seg,
      nextRound: sequence[idx + 1] ?? null,
      remainingMs: remaining,
      elapsedRoundMs: elapsedClamped,
      roundDurationMs: segDurationMs,
      totalRemainingMs: totalRemaining,
      totalElapsedMs: totalElapsed,
      totalDurationMs,
    };
  }, [tick, status, sequence, offsets, totalDurationMs, routine.repeat, routine.rounds.length]);

  return { snapshot, start, pause, resume, skip, prev, reset };
}

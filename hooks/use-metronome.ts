"use client";

import { useEffect, useRef, useState } from "react";
import { audio } from "@/lib/audio";
import type { MetronomeSound } from "@/store/timer-store";

interface Options {
  enabled: boolean;
  bpm: number;
  sound: MetronomeSound;
  volume: number;
}

/** Lookahead-scheduled metronome. Stays in time even when tab is moderately busy. */
export function useMetronome({ enabled, bpm, sound, volume }: Options) {
  const [beat, setBeat] = useState(0);
  const nextBeatTimeRef = useRef<number>(0);
  const beatCountRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || bpm <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    audio.unlock();
    audio.setVolumes({ metronome: volume });

    const stepSec = 60 / bpm;
    // Reset schedule
    nextBeatTimeRef.current = performance.now() / 1000 + 0.05;
    beatCountRef.current = 0;

    const tick = () => {
      const nowSec = performance.now() / 1000;
      // Schedule beats up to 200ms ahead
      while (nextBeatTimeRef.current < nowSec + 0.2) {
        const accent = beatCountRef.current % 4 === 0;
        audio.metronomeTick(sound, accent);
        setBeat((b) => (b + 1) % 1_000_000);
        beatCountRef.current += 1;
        nextBeatTimeRef.current += stepSec;
      }
    };
    tick();
    intervalRef.current = setInterval(tick, 60);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, bpm, sound, volume]);

  return { beat };
}

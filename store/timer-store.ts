"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Round, Routine } from "@/lib/types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const sumDuration = (rounds: Round[]) =>
  rounds.reduce((acc, r) => acc + r.durationSec, 0);

const defaultRoutine = (): Routine => {
  const rounds: Round[] = [
    { id: uid(), name: "준비", type: "prepare", durationSec: 10 },
    { id: uid(), name: "플랭크", type: "work", durationSec: 60, bpm: 90 },
    { id: uid(), name: "휴식", type: "rest", durationSec: 20 },
    { id: uid(), name: "크런치", type: "work", durationSec: 40, bpm: 80 },
    { id: uid(), name: "휴식", type: "rest", durationSec: 20 },
    { id: uid(), name: "마운틴 클라이머", type: "work", durationSec: 40, bpm: 140 },
    { id: uid(), name: "휴식", type: "rest", durationSec: 20 },
    { id: uid(), name: "사이드 플랭크", type: "work", durationSec: 40, bpm: 80 },
    { id: uid(), name: "휴식", type: "rest", durationSec: 20 },
    { id: uid(), name: "버피", type: "work", durationSec: 40, bpm: 130 },
  ];
  // Seed routine uses updatedAt: 0 so a fresh install never wins
  // against existing cloud data on first sign-in.
  return {
    id: uid(),
    name: "하루 10분 코어",
    description: "복부 + 전신 인터벌. 시작 루틴.",
    rounds,
    repeat: 1,
    totalDurationSec: sumDuration(rounds),
    createdAt: Date.now(),
    updatedAt: 0,
    tags: ["core", "10min"],
  };
};

export type MetronomeSound = "wood" | "hihat" | "click";
export type SoundTheme = "minimal" | "gym-pro" | "zen";

interface TimerStore {
  routines: Routine[];
  currentRoutineId: string | null;

  // Audio / settings
  masterVolume: number;
  timerVolume: number;
  metronomeVolume: number;
  uiVolume: number;
  voiceGuideEnabled: boolean;
  soundTheme: SoundTheme;
  metronomeEnabled: boolean;
  metronomeSound: MetronomeSound;

  // Routine library
  getCurrentRoutine: () => Routine | null;
  createRoutine: (partial?: Partial<Routine>) => string;
  duplicateRoutine: (id: string) => string;
  importRoutine: (source: Routine) => string;
  deleteRoutine: (id: string) => void;
  selectRoutine: (id: string) => void;
  updateRoutine: (id: string, patch: Partial<Routine>) => void;
  renameRoutine: (id: string, name: string) => void;
  setRepeat: (id: string, repeat: number) => void;
  rateRoutine: (id: string, rating: number) => void;
  markRoutineCompleted: (id: string) => void;

  // Round operations
  addRound: (
    routineId: string,
    round?: Partial<Round> & { type?: Round["type"] },
  ) => void;
  updateRound: (
    routineId: string,
    roundId: string,
    patch: Partial<Round>,
  ) => void;
  duplicateRound: (routineId: string, roundId: string) => void;
  removeRound: (routineId: string, roundId: string) => void;
  reorderRounds: (routineId: string, fromIdx: number, toIdx: number) => void;
  applyMetronomePresetToAll: (routineId: string, bpm: number) => void;

  // Settings
  setMasterVolume: (v: number) => void;
  setTimerVolume: (v: number) => void;
  setMetronomeVolume: (v: number) => void;
  setUiVolume: (v: number) => void;
  setVoiceGuideEnabled: (v: boolean) => void;
  setSoundTheme: (t: SoundTheme) => void;
  toggleMetronome: () => void;
  setMetronomeSound: (s: MetronomeSound) => void;
}

const updateRoutineTotals = (r: Routine): Routine => ({
  ...r,
  totalDurationSec: sumDuration(r.rounds),
  updatedAt: Date.now(),
});

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => {
      const seed = defaultRoutine();
      return {
        routines: [seed],
        currentRoutineId: seed.id,

        masterVolume: 0.8,
        timerVolume: 1,
        metronomeVolume: 0.6,
        uiVolume: 0.5,
        voiceGuideEnabled: true,
        soundTheme: "minimal",
        metronomeEnabled: false,
        metronomeSound: "wood",

        getCurrentRoutine: () => {
          const { routines, currentRoutineId } = get();
          return (
            routines.find((r) => r.id === currentRoutineId) ??
            routines[0] ??
            null
          );
        },

        createRoutine: (partial) => {
          const id = uid();
          const now = Date.now();
          const base: Routine = {
            id,
            name: partial?.name ?? "새 루틴",
            description: partial?.description,
            rounds: partial?.rounds ?? [
              { id: uid(), name: "준비", type: "prepare", durationSec: 10 },
              { id: uid(), name: "운동 1", type: "work", durationSec: 40 },
              { id: uid(), name: "휴식", type: "rest", durationSec: 20 },
            ],
            repeat: partial?.repeat ?? 1,
            totalDurationSec: 0,
            createdAt: now,
            updatedAt: now,
            tags: partial?.tags,
          };
          const seeded = updateRoutineTotals(base);
          set((s) => ({
            routines: [seeded, ...s.routines],
            currentRoutineId: id,
          }));
          return id;
        },

        importRoutine: (source) => {
          const newId = uid();
          const now = Date.now();
          const copy: Routine = {
            ...source,
            id: newId,
            name: source.name,
            rounds: source.rounds.map((r) => ({ ...r, id: uid() })),
            createdAt: now,
            updatedAt: now,
            // Strip publish-only metadata when bringing it into the local library.
            isPublic: false,
            authorId: undefined,
          };
          set((s) => ({
            routines: [copy, ...s.routines],
            currentRoutineId: newId,
          }));
          return newId;
        },

        duplicateRoutine: (id) => {
          const src = get().routines.find((r) => r.id === id);
          if (!src) return id;
          const newId = uid();
          const copy: Routine = {
            ...src,
            id: newId,
            name: `${src.name} 복사본`,
            rounds: src.rounds.map((r) => ({ ...r, id: uid() })),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          set((s) => ({
            routines: [copy, ...s.routines],
            currentRoutineId: newId,
          }));
          return newId;
        },

        deleteRoutine: (id) =>
          set((s) => {
            const next = s.routines.filter((r) => r.id !== id);
            const fallback = next[0]?.id ?? null;
            return {
              routines: next,
              currentRoutineId:
                s.currentRoutineId === id ? fallback : s.currentRoutineId,
            };
          }),

        selectRoutine: (id) => set({ currentRoutineId: id }),

        updateRoutine: (id, patch) =>
          set((s) => ({
            routines: s.routines.map((r) =>
              r.id === id
                ? updateRoutineTotals({ ...r, ...patch })
                : r,
            ),
          })),

        renameRoutine: (id, name) =>
          set((s) => ({
            routines: s.routines.map((r) =>
              r.id === id ? { ...r, name, updatedAt: Date.now() } : r,
            ),
          })),

        setRepeat: (id, repeat) =>
          set((s) => ({
            routines: s.routines.map((r) =>
              r.id === id
                ? { ...r, repeat: Math.max(1, Math.floor(repeat)), updatedAt: Date.now() }
                : r,
            ),
          })),

        rateRoutine: (id, rating) =>
          set((s) => ({
            routines: s.routines.map((r) =>
              r.id === id
                ? {
                    ...r,
                    rating: Math.min(5, Math.max(1, Math.round(rating))),
                    updatedAt: Date.now(),
                  }
                : r,
            ),
          })),

        markRoutineCompleted: (id) =>
          set((s) => ({
            routines: s.routines.map((r) =>
              r.id === id
                ? {
                    ...r,
                    completedCount: (r.completedCount ?? 0) + 1,
                    lastCompletedAt: Date.now(),
                    updatedAt: Date.now(),
                  }
                : r,
            ),
          })),

        addRound: (routineId, round) =>
          set((s) => ({
            routines: s.routines.map((r) => {
              if (r.id !== routineId) return r;
              const type = round?.type ?? "work";
              const newRound: Round = {
                id: uid(),
                name: round?.name ?? (type === "rest" ? "휴식" : type === "prepare" ? "준비" : "새 운동"),
                type,
                durationSec:
                  round?.durationSec ?? (type === "rest" ? 20 : type === "prepare" ? 10 : 40),
                bpm: round?.bpm,
              };
              return updateRoutineTotals({
                ...r,
                rounds: [...r.rounds, newRound],
              });
            }),
          })),

        updateRound: (routineId, roundId, patch) =>
          set((s) => ({
            routines: s.routines.map((r) => {
              if (r.id !== routineId) return r;
              return updateRoutineTotals({
                ...r,
                rounds: r.rounds.map((rd) =>
                  rd.id === roundId ? { ...rd, ...patch } : rd,
                ),
              });
            }),
          })),

        duplicateRound: (routineId, roundId) =>
          set((s) => ({
            routines: s.routines.map((r) => {
              if (r.id !== routineId) return r;
              const idx = r.rounds.findIndex((rd) => rd.id === roundId);
              if (idx === -1) return r;
              const src = r.rounds[idx];
              const copy: Round = { ...src, id: uid() };
              const rounds = [...r.rounds];
              rounds.splice(idx + 1, 0, copy);
              return updateRoutineTotals({ ...r, rounds });
            }),
          })),

        removeRound: (routineId, roundId) =>
          set((s) => ({
            routines: s.routines.map((r) => {
              if (r.id !== routineId) return r;
              return updateRoutineTotals({
                ...r,
                rounds: r.rounds.filter((rd) => rd.id !== roundId),
              });
            }),
          })),

        reorderRounds: (routineId, fromIdx, toIdx) =>
          set((s) => ({
            routines: s.routines.map((r) => {
              if (r.id !== routineId) return r;
              const rounds = [...r.rounds];
              const [moved] = rounds.splice(fromIdx, 1);
              rounds.splice(toIdx, 0, moved);
              return updateRoutineTotals({ ...r, rounds });
            }),
          })),

        applyMetronomePresetToAll: (routineId, bpm) =>
          set((s) => ({
            routines: s.routines.map((r) => {
              if (r.id !== routineId) return r;
              return updateRoutineTotals({
                ...r,
                rounds: r.rounds.map((rd) =>
                  rd.type === "work" ? { ...rd, bpm } : rd,
                ),
              });
            }),
          })),

        setMasterVolume: (v) => set({ masterVolume: clamp01(v) }),
        setTimerVolume: (v) => set({ timerVolume: clamp01(v) }),
        setMetronomeVolume: (v) => set({ metronomeVolume: clamp01(v) }),
        setUiVolume: (v) => set({ uiVolume: clamp01(v) }),
        setVoiceGuideEnabled: (v) => set({ voiceGuideEnabled: v }),
        setSoundTheme: (t) => set({ soundTheme: t }),
        toggleMetronome: () =>
          set((s) => ({ metronomeEnabled: !s.metronomeEnabled })),
        setMetronomeSound: (s) => set({ metronomeSound: s }),
      };
    },
    {
      name: "mypace.timer-store.v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

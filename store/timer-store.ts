"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Round, Routine, WorkoutCompletion } from "@/lib/types";

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

/** Mutually-exclusive in-workout audio source. Only one plays at a time. */
export type AudioMode = "off" | "metronome" | "bgm" | "hype";
/** "Spice level" of the motivational (hype) vocal tracks. */
export type HypeFlavor = "mild" | "medium" | "spicy";
/** Instrumental BGM mood: energetic ("boost") vs calm ("flow"). */
export type BgmMood = "boost" | "flow";

interface TimerStore {
  routines: Routine[];
  currentRoutineId: string | null;

  // Private per-user log of finished runs (date-based history + streak).
  completions: WorkoutCompletion[];

  // Target number of finished workouts per week (drives the history goal ring).
  // Personal preference — persisted locally only, like the audio settings.
  weeklyGoal: number;

  // Which signed-in account this persisted store currently belongs to.
  // null = never synced (fresh install / guest data). Used to stop one
  // account's local data from leaking into another's on the same browser.
  ownerUid: string | null;

  // Audio / settings
  masterVolume: number;
  timerVolume: number;
  metronomeVolume: number;
  musicVolume: number;
  uiVolume: number;
  voiceGuideEnabled: boolean;
  soundTheme: SoundTheme;
  // Which audio source plays during a workout (exclusive).
  audioMode: AudioMode;
  bgmMood: BgmMood;
  hypeFlavor: HypeFlavor;
  metronomeSound: MetronomeSound;

  // Account lifecycle (data isolation across accounts on a shared browser).
  claimForAccount: (uid: string) => void;
  clearForSignOut: () => void;

  // Remove a logged completion (e.g. an accidental run left to finish itself).
  deleteCompletion: (id: string) => void;

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
  setMusicVolume: (v: number) => void;
  setUiVolume: (v: number) => void;
  setVoiceGuideEnabled: (v: boolean) => void;
  setSoundTheme: (t: SoundTheme) => void;
  setAudioMode: (m: AudioMode) => void;
  setBgmMood: (m: BgmMood) => void;
  setHypeFlavor: (f: HypeFlavor) => void;
  setMetronomeSound: (s: MetronomeSound) => void;
  setWeeklyGoal: (n: number) => void;
}

export const WEEKLY_GOAL_MIN = 1;
export const WEEKLY_GOAL_MAX = 14;

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
        completions: [],
        weeklyGoal: 3,
        ownerUid: null,

        masterVolume: 0.8,
        timerVolume: 1,
        metronomeVolume: 0.6,
        musicVolume: 0.7,
        uiVolume: 0.5,
        voiceGuideEnabled: true,
        soundTheme: "minimal",
        audioMode: "off",
        bgmMood: "boost",
        hypeFlavor: "mild",
        metronomeSound: "wood",

        claimForAccount: (uid) =>
          set((s) => {
            // Same account (or a reload of the same session): keep everything.
            if (s.ownerUid === uid) return {};
            // Guest data never synced to anyone — adopt it for this account so
            // a first-time signer-in still seeds their cloud from local work.
            if (s.ownerUid === null) return { ownerUid: uid };
            // Belongs to a DIFFERENT account that was used on this browser.
            // Drop its private data so it can't merge into / leak up to this
            // account. Cloud is the source of truth and will repopulate.
            const fresh = defaultRoutine();
            return {
              ownerUid: uid,
              routines: [fresh],
              currentRoutineId: fresh.id,
              completions: [],
            };
          }),

        clearForSignOut: () =>
          set(() => {
            const fresh = defaultRoutine();
            return {
              ownerUid: null,
              routines: [fresh],
              currentRoutineId: fresh.id,
              completions: [],
            };
          }),

        deleteCompletion: (id) =>
          set((s) => ({
            completions: s.completions.filter((c) => c.id !== id),
          })),

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
          set((s) => {
            const now = Date.now();
            const routine = s.routines.find((r) => r.id === id);
            const completion: WorkoutCompletion | null = routine
              ? {
                  id: uid(),
                  routineId: id,
                  routineName: routine.name,
                  completedAt: now,
                  durationSec: routine.totalDurationSec * routine.repeat,
                }
              : null;
            return {
              routines: s.routines.map((r) =>
                r.id === id
                  ? {
                      ...r,
                      completedCount: (r.completedCount ?? 0) + 1,
                      lastCompletedAt: now,
                      updatedAt: now,
                    }
                  : r,
              ),
              completions: completion
                ? [...s.completions, completion]
                : s.completions,
            };
          }),

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
        setMusicVolume: (v) => set({ musicVolume: clamp01(v) }),
        setUiVolume: (v) => set({ uiVolume: clamp01(v) }),
        setVoiceGuideEnabled: (v) => set({ voiceGuideEnabled: v }),
        setSoundTheme: (t) => set({ soundTheme: t }),
        setAudioMode: (m) => set({ audioMode: m }),
        setBgmMood: (m) => set({ bgmMood: m }),
        setHypeFlavor: (f) => set({ hypeFlavor: f }),
        setMetronomeSound: (s) => set({ metronomeSound: s }),
        setWeeklyGoal: (n) =>
          set({
            weeklyGoal: Math.min(
              WEEKLY_GOAL_MAX,
              Math.max(WEEKLY_GOAL_MIN, Math.round(n)),
            ),
          }),
      };
    },
    {
      name: "mypace.timer-store.v1",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // v1 → v2: the metronome on/off toggle became a 4-way exclusive audioMode
      // (off / metronome / bgm / hype). Carry the old toggle forward.
      migrate: (persisted, version) => {
        const s = persisted as Record<string, unknown> | undefined;
        if (s && version < 2) {
          s.audioMode = s.metronomeEnabled ? "metronome" : "off";
          s.hypeFlavor = "mild";
          s.musicVolume = 0.7;
          delete s.metronomeEnabled;
        }
        return s as unknown as TimerStore;
      },
    },
  ),
);

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

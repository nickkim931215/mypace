import { describe, expect, it } from "vitest";
import { canPush, mergeCompletions } from "./sync";
import type { WorkoutCompletion } from "./types";

// Regression tests for the 2026-06-19 incident: a sync race let an empty/stale
// local state overwrite real cloud workout history via setDoc(merge:false).
// These lock the two invariants that prevent it from ever happening again.

const c = (id: string, completedAt: number): WorkoutCompletion => ({
  id,
  routineId: "r",
  routineName: "n",
  completedAt,
  durationSec: 60,
});

describe("canPush — the gate that blocks pushes before cloud is reconciled", () => {
  it("refuses to push before the first cloud snapshot has hydrated", () => {
    // This is the exact condition that caused the incident: a push fired
    // against an empty local before cloud history had loaded.
    expect(canPush({ hydrated: false, applyingRemote: false })).toBe(false);
  });

  it("refuses to push while a remote snapshot is being applied", () => {
    expect(canPush({ hydrated: true, applyingRemote: true })).toBe(false);
  });

  it("allows a push only once hydrated AND idle", () => {
    expect(canPush({ hydrated: true, applyingRemote: false })).toBe(true);
  });
});

describe("mergeCompletions — append-only: reconcile never drops history", () => {
  it("an empty side can never erase the other side's real history", () => {
    const history = [c("a", 1), c("b", 2), c("c", 3)];
    // Empty local + real cloud  -> keeps cloud (the incident's failure mode).
    expect(mergeCompletions([], history)).toHaveLength(3);
    // Real local + empty cloud  -> keeps local.
    expect(mergeCompletions(history, [])).toHaveLength(3);
  });

  it("unions both sides by id, losing neither", () => {
    const merged = mergeCompletions([c("a", 1), c("b", 2)], [c("b", 2), c("c", 3)]);
    expect(merged.map((x) => x.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("result is a superset of each input and never shrinks below the larger", () => {
    const local = [c("a", 1), c("b", 2), c("d", 4)];
    const cloud = [c("b", 2), c("c", 3)];
    const merged = mergeCompletions(local, cloud);
    for (const x of [...local, ...cloud]) {
      expect(merged.some((m) => m.id === x.id)).toBe(true);
    }
    expect(merged.length).toBeGreaterThanOrEqual(
      Math.max(local.length, cloud.length),
    );
  });

  it("dedupes a record present on both sides", () => {
    expect(mergeCompletions([c("a", 1)], [c("a", 1)])).toHaveLength(1);
  });

  it("keeps the merged log sorted oldest-first", () => {
    const merged = mergeCompletions([c("c", 3), c("a", 1)], [c("b", 2)]);
    expect(merged.map((x) => x.completedAt)).toEqual([1, 2, 3]);
  });
});

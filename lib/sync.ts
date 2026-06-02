import {
  doc,
  onSnapshot,
  setDoc,
  type DocumentReference,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/firebase/config";
import type { Routine, WorkoutCompletion } from "@/lib/types";

export interface CloudSnapshot {
  routines: Routine[];
  currentRoutineId: string | null;
  // Append-only workout history. Merged by id (never truncated) so completions
  // logged on one device aren't lost when another device pushes.
  completions: WorkoutCompletion[];
  updatedAt: number;
}

function userDoc(uid: string): DocumentReference {
  return doc(getDb(), "users", uid);
}

export function subscribeUserDoc(
  uid: string,
  onChange: (snap: CloudSnapshot | null) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    userDoc(uid),
    (s) => {
      if (!s.exists()) {
        onChange(null);
        return;
      }
      const data = s.data() as Partial<CloudSnapshot> | undefined;
      onChange({
        routines: Array.isArray(data?.routines) ? data!.routines : [],
        currentRoutineId: data?.currentRoutineId ?? null,
        completions: Array.isArray(data?.completions) ? data!.completions : [],
        updatedAt: typeof data?.updatedAt === "number" ? data.updatedAt : 0,
      });
    },
    (err) => {
      console.error("[sync] subscribe error:", err);
      onError?.(err);
    },
  );
}

export async function pushUserDoc(
  uid: string,
  snap: CloudSnapshot,
): Promise<void> {
  await setDoc(userDoc(uid), snap, { merge: false });
}

export function maxUpdatedAt(routines: Routine[]): number {
  let m = 0;
  for (const r of routines) if (r.updatedAt > m) m = r.updatedAt;
  return m;
}

// Union two completion logs by id (append-only — history is never lost when
// devices reconcile), kept sorted oldest-first.
export function mergeCompletions(
  a: WorkoutCompletion[],
  b: WorkoutCompletion[],
): WorkoutCompletion[] {
  const byId = new Map<string, WorkoutCompletion>();
  for (const c of a) byId.set(c.id, c);
  for (const c of b) byId.set(c.id, c);
  return [...byId.values()].sort((x, y) => x.completedAt - y.completedAt);
}

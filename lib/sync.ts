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
  onChange: (snap: CloudSnapshot | null, fromCache: boolean) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    userDoc(uid),
    (s) => {
      // fromCache lets the caller distinguish a server-confirmed view from a
      // local-cache guess — critical so a cold-cache "doc missing" isn't taken
      // as truth and used to overwrite a real cloud doc.
      const fromCache = s.metadata.fromCache;
      if (!s.exists()) {
        onChange(null, fromCache);
        return;
      }
      const data = s.data() as Partial<CloudSnapshot> | undefined;
      onChange(
        {
          routines: Array.isArray(data?.routines) ? data!.routines : [],
          currentRoutineId: data?.currentRoutineId ?? null,
          completions: Array.isArray(data?.completions)
            ? data!.completions
            : [],
          updatedAt: typeof data?.updatedAt === "number" ? data.updatedAt : 0,
        },
        fromCache,
      );
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

// Pure guard for whether the bridge may push local state up to the cloud right
// now. Pushing is only safe AFTER the first cloud snapshot for the account has
// been reconciled into local (`hydrated`) and while we are not mid-apply of a
// remote snapshot. Extracted as a pure function so this data-loss-prevention
// invariant can be unit-tested without React/Firestore.
export function canPush(state: {
  hydrated: boolean;
  applyingRemote: boolean;
}): boolean {
  return state.hydrated && !state.applyingRemote;
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

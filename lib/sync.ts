import {
  doc,
  onSnapshot,
  setDoc,
  type DocumentReference,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/firebase/config";
import type { Routine } from "@/lib/types";

export interface CloudSnapshot {
  routines: Routine[];
  currentRoutineId: string | null;
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

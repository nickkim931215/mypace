"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTimerStore } from "@/store/timer-store";
import { useSyncStore } from "@/store/sync-store";
import { getLevel } from "@/lib/level";
import { syncProfileLevel } from "@/lib/profile";
import {
  canPush,
  maxUpdatedAt,
  mergeCompletions,
  pushUserDoc,
  subscribeUserDoc,
  type CloudSnapshot,
} from "@/lib/sync";

const PUSH_DEBOUNCE_MS = 700;

export function SyncBridge() {
  const { user, configured } = useAuth();
  const applyingRemoteRef = useRef(false);
  const lastPushedAtRef = useRef(0);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialAppliedRef = useRef(false);
  // True once the first cloud snapshot for THIS account has been received and
  // reconciled. Until then we must never push: local may be empty or stale
  // (e.g. right after claimForAccount wiped a previous account's data, or on a
  // fresh device whose cloud history hasn't downloaded yet). Pushing in that
  // window would overwrite the cloud's real history via setDoc(merge:false) —
  // exactly how a full workout log can get wiped on account switch / re-login.
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!configured) return;
    if (!user) {
      useSyncStore.getState().setStatus("idle");
      // Signed out: drop any account-owned local data so the next viewer or
      // account on this browser can't see or inherit it.
      const s = useTimerStore.getState();
      if (s.ownerUid !== null) s.clearForSignOut();
      return;
    }

    const uid = user.uid;
    // Reconcile local data ownership BEFORE any merge/push. If localStorage
    // still holds a different account's routines/completions (account switch on
    // a shared browser), claimForAccount wipes them so they never merge into or
    // leak up to this account's cloud doc.
    useTimerStore.getState().claimForAccount(uid);
    useSyncStore.getState().setStatus("loading");
    initialAppliedRef.current = false;
    hydratedRef.current = false;

    function buildSnapshot(): CloudSnapshot {
      const s = useTimerStore.getState();
      const localMax = maxUpdatedAt(s.routines);
      return {
        routines: s.routines,
        currentRoutineId: s.currentRoutineId,
        completions: s.completions,
        updatedAt: Math.max(localMax, Date.now()),
      };
    }

    function schedulePush() {
      // Never push before the first cloud reconcile, and never mid-apply of a
      // remote snapshot. canPush() centralizes this guard (see hydratedRef) so
      // the invariant — empty/stale local can't clobber real cloud history — is
      // unit-tested in isolation.
      if (
        !canPush({
          hydrated: hydratedRef.current,
          applyingRemote: applyingRemoteRef.current,
        })
      )
        return;
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
      useSyncStore.getState().setStatus("syncing");
      pushTimerRef.current = setTimeout(async () => {
        const snap = buildSnapshot();
        try {
          await pushUserDoc(uid, snap);
          lastPushedAtRef.current = snap.updatedAt;
          useSyncStore.getState().markSynced();
        } catch (err) {
          console.error("[sync] push failed:", err);
          useSyncStore
            .getState()
            .setStatus("error", "동기화에 실패했습니다.");
        }
      }, PUSH_DEBOUNCE_MS);
    }

    const unsubRemote = subscribeUserDoc(
      uid,
      (cloud, fromCache) => {
        // A cache-only "doc doesn't exist" is ambiguous: it can mean a cold
        // local cache (offline / first paint) just as easily as a genuinely new
        // account. Treating it as truth would let us seed/push empty local over
        // a real cloud doc. So ignore it and wait for the server snapshot.
        if (!cloud && fromCache) return;
        // We now know the cloud state for this account; from here every branch
        // below merges cloud history before any push, so pushing is safe.
        hydratedRef.current = true;
        if (!cloud) {
          // First sign-in on this account (server-confirmed empty) — seed cloud.
          initialAppliedRef.current = true;
          schedulePush();
          return;
        }

        // Ignore the echo of our own write.
        if (cloud.updatedAt === lastPushedAtRef.current) {
          useSyncStore.getState().markSynced();
          return;
        }

        const local = useTimerStore.getState();
        const localMax = maxUpdatedAt(local.routines);

        const shouldApplyRemote =
          !initialAppliedRef.current
            ? cloud.updatedAt >= localMax
            : cloud.updatedAt > localMax;

        // History is append-only: always union, never let a reconcile drop
        // completions logged on either side.
        const mergedCompletions = mergeCompletions(
          local.completions,
          cloud.completions,
        );
        const completionsGrew =
          mergedCompletions.length !== local.completions.length;

        if (shouldApplyRemote && cloud.routines.length > 0) {
          applyingRemoteRef.current = true;
          useTimerStore.setState({
            routines: cloud.routines,
            currentRoutineId:
              cloud.currentRoutineId ?? cloud.routines[0]?.id ?? null,
            completions: mergedCompletions,
          });
          // Release on next tick so the subscriber sees consistent state.
          queueMicrotask(() => {
            applyingRemoteRef.current = false;
          });
          lastPushedAtRef.current = cloud.updatedAt;
          useSyncStore.getState().markSynced();
        } else if (completionsGrew) {
          // Not taking remote routines, but the cloud had history we lack —
          // absorb it, then push our (now-unioned) log back up.
          applyingRemoteRef.current = true;
          useTimerStore.setState({ completions: mergedCompletions });
          queueMicrotask(() => {
            applyingRemoteRef.current = false;
            schedulePush();
          });
        } else if (!initialAppliedRef.current) {
          // Local is newer — push it up.
          schedulePush();
        }
        initialAppliedRef.current = true;
      },
      () => {
        useSyncStore
          .getState()
          .setStatus("error", "Firestore에 연결할 수 없습니다.");
      },
    );

    const unsubLocal = useTimerStore.subscribe((state, prev) => {
      if (applyingRemoteRef.current) return;
      if (
        state.routines === prev.routines &&
        state.currentRoutineId === prev.currentRoutineId &&
        state.completions === prev.completions
      ) {
        return;
      }
      schedulePush();
    });

    return () => {
      unsubRemote();
      unsubLocal();
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
      useSyncStore.getState().setStatus("idle");
    };
  }, [user, configured]);

  // Mirror the user's gamified level onto their PUBLIC profile whenever their
  // workout count crosses a tier boundary, so it can show next to their
  // nickname in the community. Deduped — only writes when the level changes,
  // and only records success so a pre-seed race retries on the next change.
  const lastLevelRef = useRef<number | null>(null);
  useEffect(() => {
    if (!configured || !user) {
      lastLevelRef.current = null;
      return;
    }
    const uid = user.uid;
    lastLevelRef.current = null; // fresh account → always write its level once

    const maybePush = async () => {
      const count = useTimerStore.getState().completions.length;
      const level = getLevel(count).level;
      if (level === lastLevelRef.current) return;
      if (await syncProfileLevel(uid, level)) lastLevelRef.current = level;
    };

    void maybePush(); // sync whatever's already loaded
    const unsub = useTimerStore.subscribe((state, prev) => {
      if (state.completions === prev.completions) return;
      void maybePush();
    });
    return () => unsub();
  }, [user, configured]);

  return null;
}

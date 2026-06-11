"use client";

import { useEffect, useState } from "react";
import { subscribeProfile, type Profile } from "@/lib/profile";

// Live display-name lookup. Resolves a uid to its CURRENT nickname so renamed
// users show their new name everywhere — including on posts/comments they wrote
// long ago, which only carry a stale `authorName` snapshot.
//
// Listeners are shared + ref-counted per uid, so a comment thread with the same
// author 20 times opens exactly one Firestore listener.

interface Entry {
  profile: Profile | null;
  loaded: boolean;
  subs: Set<() => void>;
  unsub: () => void;
}

const cache = new Map<string, Entry>();

function acquire(uid: string): Entry {
  const entry = cache.get(uid);
  if (entry) return entry;
  const created: Entry = {
    profile: null,
    loaded: false,
    subs: new Set(),
    unsub: () => {},
  };
  created.unsub = subscribeProfile(uid, (profile) => {
    created.profile = profile;
    created.loaded = true;
    created.subs.forEach((notify) => notify());
  });
  cache.set(uid, created);
  return created;
}

export function useProfileName(
  uid: string | null | undefined,
  fallback: string,
): string {
  const [, force] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const entry = acquire(uid);
    const notify = () => force((n) => n + 1);
    entry.subs.add(notify);
    notify(); // sync to whatever's already cached
    return () => {
      entry.subs.delete(notify);
      if (entry.subs.size === 0) {
        entry.unsub();
        cache.delete(uid);
      }
    };
  }, [uid]);

  if (!uid) return fallback;
  const entry = cache.get(uid);
  return entry?.profile?.nickname ?? fallback;
}

// Live level lookup for a uid, sharing the same ref-counted profile listener as
// useProfileName. Returns null while loading or for profiles with no level yet.
export function useProfileLevel(uid: string | null | undefined): number | null {
  const [, force] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const entry = acquire(uid);
    const notify = () => force((n) => n + 1);
    entry.subs.add(notify);
    notify();
    return () => {
      entry.subs.delete(notify);
      if (entry.subs.size === 0) {
        entry.unsub();
        cache.delete(uid);
      }
    };
  }, [uid]);

  if (!uid) return null;
  const entry = cache.get(uid);
  return entry?.profile?.level ?? null;
}

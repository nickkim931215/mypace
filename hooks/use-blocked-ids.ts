"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { subscribeBlockedIds } from "@/lib/moderation";

// Live set of uids the current user has blocked. Empty for signed-out users.
// Drives content filtering — the feed, comment threads, and user search all
// drop authors whose uid is in this set, so a blocked person disappears for the
// blocker without any server-side fan-out.
export function useBlockedIds(): Set<string> {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (!uid) {
      setIds([]);
      return;
    }
    return subscribeBlockedIds(uid, setIds);
  }, [uid]);

  return useMemo(() => new Set(ids), [ids]);
}

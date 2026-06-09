"use client";

import { useEffect, useState } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  follow,
  unfollow,
  subscribeIsFollowing,
} from "@/lib/follow";
import { createNotification } from "@/lib/notifications";
import { cn } from "@/lib/utils";

// Follow/unfollow toggle for another user. Renders nothing for signed-out
// users or when pointed at yourself. State is driven by a live subscription so
// it stays correct across tabs/devices.
export function FollowButton({
  targetUid,
  className,
  size = "md",
  onChange,
}: {
  targetUid: string;
  className?: string;
  size?: "sm" | "md";
  onChange?: (following: boolean) => void;
}) {
  const { user } = useAuth();
  const me = user?.uid ?? null;
  const [following, setFollowing] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!me || me === targetUid) return;
    const unsub = subscribeIsFollowing(me, targetUid, (f) => {
      setFollowing(f);
      setReady(true);
    });
    return unsub;
  }, [me, targetUid]);

  if (!me || me === targetUid) return null;

  async function onClick() {
    if (!me || busy) return;
    setBusy(true);
    // Optimistic flip — the subscription will reconcile.
    const next = !following;
    setFollowing(next);
    try {
      if (next) {
        await follow(me, targetUid);
        onChange?.(true);
        // Tell the followee. Fire-and-forget; never block the toggle.
        void createNotification({
          recipientId: targetUid,
          type: "follow",
          actorId: me,
          actorName: user?.displayName ?? user?.email ?? "익명",
          actorPhotoURL: user?.photoURL ?? null,
        }).catch(() => {});
      } else {
        await unfollow(me, targetUid);
        onChange?.(false);
      }
    } catch {
      setFollowing(!next); // revert on failure
    } finally {
      setBusy(false);
    }
  }

  const isSm = size === "sm";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || !ready}
      aria-pressed={following}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors disabled:opacity-60 shrink-0",
        isSm ? "h-8 px-3 text-[12px]" : "h-9 px-4 text-[13px]",
        following
          ? "bg-surface-2 text-foreground-muted hover:text-foreground border border-border-subtle"
          : "bg-accent text-background hover:bg-accent/90",
        className,
      )}
    >
      {busy ? (
        <Loader2 size={isSm ? 13 : 14} className="animate-spin" />
      ) : following ? (
        <UserCheck size={isSm ? 13 : 14} />
      ) : (
        <UserPlus size={isSm ? 13 : 14} />
      )}
      {following ? "팔로잉" : "팔로우"}
    </button>
  );
}

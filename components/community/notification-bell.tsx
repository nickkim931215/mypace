"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Bell,
  Heart,
  MessageCircle,
  CornerDownRight,
  Check,
  UserPlus,
  Dumbbell,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  subscribeNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";
import type { AppNotification } from "@/lib/types";
import { useProfileName } from "@/hooks/use-profile-name";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { state, configured } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const uid = state.status === "signedIn" ? state.user.uid : null;

  useEffect(() => {
    if (!uid) {
      setItems([]);
      return;
    }
    const unsub = subscribeNotifications(uid, setItems);
    return unsub;
  }, [uid]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!configured || !uid) return null;

  const unread = items.filter((n) => !n.read).length;

  function openPanel() {
    setOpen((v) => {
      const next = !v;
      // Mark everything read when opening the panel.
      if (next && unread > 0 && uid) {
        void markAllNotificationsRead(uid).catch(() => {});
      }
      return next;
    });
  }

  function onItemClick(n: AppNotification) {
    if (uid && !n.read) void markNotificationRead(uid, n.id).catch(() => {});
    setOpen(false);
    // Follow notifications have no post to open — just acknowledge them.
    if (n.type === "follow" || !n.postId) return;
    router.push(`/community?post=${n.postId}`);
    // If we're already on /community the route won't remount, so signal the
    // feed directly to open the post.
    window.dispatchEvent(
      new CustomEvent("mypace:open-post", { detail: n.postId }),
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={openPanel}
        aria-label={unread > 0 ? `알림 ${unread}개` : "알림"}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative h-9 w-9 rounded-full hover:bg-surface-1 flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-accent text-background text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="fixed left-3 right-3 top-[calc(env(safe-area-inset-top)+4rem)] w-auto sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[340px] card-premium p-0 shadow-2xl shadow-black/40 z-50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
            <span className="text-[13px] font-semibold">알림</span>
            {items.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-foreground-dim">
                <Check size={12} /> 읽음 처리됨
              </span>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-foreground-dim">
                아직 알림이 없어요.
              </p>
            ) : (
              <ul className="flex flex-col">
                {items.map((n) => (
                  <NotificationRow
                    key={n.id}
                    n={n}
                    onClick={() => onItemClick(n)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  n,
  onClick,
}: {
  n: AppNotification;
  onClick: () => void;
}) {
  const actorName = useProfileName(n.actorId, n.actorName);
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-surface-1 transition-colors",
          !n.read && "bg-accent/5",
        )}
      >
        <NotifIcon type={n.type} photo={n.actorPhotoURL} name={actorName} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-snug">
            <span className="font-medium">{actorName}</span>
            <span className="text-foreground-muted">
              {n.type === "like"
                ? "님이 좋아요를 눌렀어요"
                : n.type === "reply"
                  ? "님이 답글을 남겼어요"
                  : n.type === "follow"
                    ? "님이 회원님을 팔로우했어요"
                    : n.type === "post"
                      ? "님이 운동을 인증했어요 💪"
                      : "님이 댓글을 남겼어요"}
            </span>
          </p>
          {n.preview && (
            <p className="mt-0.5 text-[12px] text-foreground-muted line-clamp-1">
              “{n.preview}”
            </p>
          )}
          <p className="mt-0.5 text-[11px] text-foreground-dim truncate">
            {n.type === "follow"
              ? formatRelative(n.createdAt)
              : `${n.postTitle} · ${formatRelative(n.createdAt)}`}
          </p>
        </div>
        {!n.read && (
          <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
        )}
      </button>
    </li>
  );
}

function NotifIcon({
  type,
  photo,
  name,
}: {
  type: AppNotification["type"];
  photo: string | null;
  name: string;
}) {
  const Badge =
    type === "like"
      ? Heart
      : type === "reply"
        ? CornerDownRight
        : type === "follow"
          ? UserPlus
          : type === "post"
            ? Dumbbell
            : MessageCircle;
  return (
    <span className="relative shrink-0">
      {photo ? (
        <Image
          src={photo}
          alt=""
          width={32}
          height={32}
          className="rounded-full object-cover"
          unoptimized
        />
      ) : (
        <span className="h-8 w-8 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[11px] font-semibold">
          {name.trim().slice(0, 1).toUpperCase() || "?"}
        </span>
      )}
      <span
        className={cn(
          "absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center border border-surface-1",
          type === "like" ? "bg-danger text-white" : "bg-accent text-background",
        )}
      >
        <Badge size={9} className={type === "like" ? "fill-white" : ""} />
      </span>
    </span>
  );
}

function formatRelative(ts: number): string {
  if (!ts) return "방금";
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(ts).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

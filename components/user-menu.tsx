"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useSyncStore, type SyncStatus } from "@/store/sync-store";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LogIn,
  Cloud,
  CloudOff,
  Loader2,
  Check,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { state, configured, signInGoogle, signOut, error } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
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

  if (!configured) {
    return (
      <span
        className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-foreground-dim px-2.5 h-8 rounded-full border border-border-subtle"
        title="Firebase가 설정되지 않아 로컬에만 저장됩니다."
      >
        <CloudOff size={12} />
        로컬 모드
      </span>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="h-8 w-8 rounded-full bg-surface-2 animate-pulse" />
    );
  }

  if (state.status === "signedOut" || state.status === "unconfigured") {
    return (
      <div className="flex items-center gap-2">
        {error && (
          <span className="hidden md:inline text-[11px] text-danger">
            {error}
          </span>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void signInGoogle()}
        >
          <LogIn size={14} />
          로그인
        </Button>
      </div>
    );
  }

  const user = state.user;
  const photo = user.photoURL;
  const displayName = user.displayName ?? user.email ?? "사용자";
  const initials = displayName.trim().slice(0, 1).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-9 pl-1 pr-2.5 rounded-full hover:bg-surface-1 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar photo={photo} initials={initials} />
        <SyncDot />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 card-premium p-2 shadow-2xl shadow-black/40 z-50"
        >
          <div className="px-3 py-2.5 flex items-center gap-3">
            <Avatar photo={photo} initials={initials} size={36} />
            <div className="min-w-0">
              <p className="text-[13px] font-medium truncate">{displayName}</p>
              {user.email && user.email !== displayName && (
                <p className="text-[11px] text-foreground-dim truncate">
                  {user.email}
                </p>
              )}
            </div>
          </div>
          <SyncRow />
          <Link
            href="/history"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="w-full mt-1 flex items-center gap-2 px-3 h-10 rounded-xl text-[13px] text-foreground-muted hover:text-foreground hover:bg-surface-1 transition-colors"
          >
            <CalendarDays size={14} />
            내 기록
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="w-full flex items-center gap-2 px-3 h-10 rounded-xl text-[13px] text-foreground-muted hover:text-foreground hover:bg-surface-1 transition-colors"
          >
            <LogOut size={14} />
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}

function Avatar({
  photo,
  initials,
  size = 28,
}: {
  photo: string | null;
  initials: string;
  size?: number;
}) {
  if (photo) {
    return (
      <Image
        src={photo}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        unoptimized
      />
    );
  }
  return (
    <span
      className="rounded-full bg-accent/15 text-accent flex items-center justify-center text-[11px] font-semibold"
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}

function SyncDot() {
  const status = useSyncStore((s) => s.status);
  const tone =
    status === "syncing" || status === "loading"
      ? "bg-accent animate-pulse"
      : status === "synced"
        ? "bg-emerald-400"
        : status === "error"
          ? "bg-danger"
          : "bg-foreground-dim/50";
  return (
    <span
      aria-hidden
      className={cn("h-1.5 w-1.5 rounded-full transition-colors", tone)}
    />
  );
}

function SyncRow() {
  const status = useSyncStore((s) => s.status);
  const errorMessage = useSyncStore((s) => s.errorMessage);
  const { Icon, label } = describeSync(status);
  return (
    <div className="mx-1 px-3 py-2 rounded-xl bg-surface-1/60 flex items-center gap-2.5 text-[12px] text-foreground-muted">
      <Icon size={13} className="text-accent" />
      <span className="truncate">{errorMessage ?? label}</span>
    </div>
  );
}

function describeSync(status: SyncStatus) {
  switch (status) {
    case "loading":
      return { Icon: Loader2, label: "클라우드에서 불러오는 중..." };
    case "syncing":
      return { Icon: Loader2, label: "동기화 중..." };
    case "synced":
      return { Icon: Check, label: "동기화 완료" };
    case "error":
      return { Icon: CloudOff, label: "동기화 오류" };
    case "offline":
      return { Icon: CloudOff, label: "오프라인" };
    default:
      return { Icon: Cloud, label: "대기 중" };
  }
}

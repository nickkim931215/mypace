"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { User } from "firebase/auth";
import { useAuth } from "@/lib/auth-context";
import { useProfileName } from "@/hooks/use-profile-name";
import { useSyncStore, type SyncStatus } from "@/store/sync-store";
import { useLocale, useT, type Locale, type TranslateFn } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LogIn,
  Cloud,
  CloudOff,
  Loader2,
  Check,
  CalendarDays,
  UserRound,
  Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { state, configured, signInGoogle, signOut, error } = useAuth();
  const t = useT();

  if (!configured) {
    return (
      <span
        className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-foreground-dim px-2.5 h-8 rounded-full border border-border-subtle"
        title={t(
          "Firebase가 설정되지 않아 로컬에만 저장됩니다.",
          "Firebase is not configured, so data is saved locally only.",
        )}
      >
        <CloudOff size={12} />
        {t("로컬 모드", "Local mode")}
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
          {t("로그인", "Sign in")}
        </Button>
      </div>
    );
  }

  return <SignedInMenu user={state.user} signOut={signOut} />;
}

function SignedInMenu({
  user,
  signOut,
}: {
  user: User;
  signOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const t = useT();

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

  const photo = user.photoURL;
  const fallbackName = user.displayName ?? user.email ?? t("사용자", "User");
  const displayName = useProfileName(user.uid, fallbackName);
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
          className="fixed right-3 left-auto top-[calc(env(safe-area-inset-top)+4rem)] w-[min(16rem,calc(100vw-1.5rem))] sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-64 card-premium p-2 shadow-2xl shadow-black/40 z-50"
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
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="w-full mt-1 flex items-center gap-2 px-3 h-10 rounded-xl text-[13px] text-foreground-muted hover:text-foreground hover:bg-surface-1 transition-colors"
          >
            <UserRound size={14} />
            {t("내 프로필", "My profile")}
          </Link>
          <Link
            href="/history"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-3 h-10 rounded-xl text-[13px] text-foreground-muted hover:text-foreground hover:bg-surface-1 transition-colors"
          >
            <CalendarDays size={14} />
            {t("내 기록", "My records")}
          </Link>
          <LanguageRow />
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
            {t("로그아웃", "Sign out")}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * The "언어 / Language" control inside the account dropdown. Renders a small
 * segmented toggle between Korean and English; the choice is persisted globally
 * via the locale context so every screen re-renders in the chosen language.
 */
function LanguageRow() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const options: { value: Locale; label: string }[] = [
    { value: "ko", label: "한국어" },
    { value: "en", label: "English" },
  ];
  return (
    <div className="mt-1 px-3 pt-2 pb-1">
      <div className="flex items-center gap-2 text-[12px] text-foreground-dim mb-1.5">
        <Languages size={14} />
        <span>{t("언어", "Language")}</span>
      </div>
      <div
        role="group"
        aria-label={t("언어 선택", "Select language")}
        className="grid grid-cols-2 gap-1 rounded-xl bg-surface-1/60 p-1"
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={locale === opt.value}
            onClick={() => setLocale(opt.value)}
            className={cn(
              "h-8 rounded-lg text-[12px] font-medium transition-colors",
              locale === opt.value
                ? "bg-accent/15 text-accent"
                : "text-foreground-muted hover:text-foreground hover:bg-surface-2/60",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
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
  const t = useT();
  const { Icon, label } = describeSync(status, t);
  return (
    <div className="mx-1 px-3 py-2 rounded-xl bg-surface-1/60 flex items-center gap-2.5 text-[12px] text-foreground-muted">
      <Icon size={13} className="text-accent" />
      <span className="truncate">{errorMessage ?? label}</span>
    </div>
  );
}

function describeSync(status: SyncStatus, t: TranslateFn) {
  switch (status) {
    case "loading":
      return { Icon: Loader2, label: t("클라우드에서 불러오는 중...", "Loading from cloud...") };
    case "syncing":
      return { Icon: Loader2, label: t("동기화 중...", "Syncing...") };
    case "synced":
      return { Icon: Check, label: t("동기화 완료", "Synced") };
    case "error":
      return { Icon: CloudOff, label: t("동기화 오류", "Sync error") };
    case "offline":
      return { Icon: CloudOff, label: t("오프라인", "Offline") };
    default:
      return { Icon: Cloud, label: t("대기 중", "Idle") };
  }
}

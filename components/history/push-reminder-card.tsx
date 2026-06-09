"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  BellRing,
  Loader2,
  Check,
  AlertCircle,
  Send,
} from "lucide-react";
import { useTimerStore } from "@/store/timer-store";
import {
  isPushSupported,
  isPushConfigured,
  isIosNeedsInstall,
  notificationPermission,
  getExistingSubscription,
  enablePush,
  disablePush,
  sendTestPush,
} from "@/lib/push";
import { cn } from "@/lib/utils";

type Env =
  | "loading"
  | "unsupported"
  | "ios-install"
  | "unconfigured"
  | "ready";

export function PushReminderCard() {
  const hour = useTimerStore((s) => s.reminderHour);
  const minute = useTimerStore((s) => s.reminderMinute);
  const setReminderTime = useTimerStore((s) => s.setReminderTime);

  const [env, setEnv] = useState<Env>("loading");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );

  // Probe capability + existing subscription on mount (client-only).
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isPushSupported()) {
        if (alive) setEnv(isIosNeedsInstall() ? "ios-install" : "unsupported");
        return;
      }
      if (!isPushConfigured()) {
        if (alive) setEnv("unconfigured");
        return;
      }
      const sub = await getExistingSubscription();
      if (!alive) return;
      setEnabled(!!sub && notificationPermission() === "granted");
      setEnv("ready");
    })();
    return () => {
      alive = false;
    };
  }, []);

  const timeValue = `${pad(hour)}:${pad(minute)}`;

  async function onToggle() {
    setMsg(null);
    if (busy) return;
    setBusy(true);
    try {
      if (enabled) {
        await disablePush();
        setEnabled(false);
        setMsg({ kind: "ok", text: "알림을 껐어요." });
      } else {
        const res = await enablePush();
        if (res.ok) {
          setEnabled(true);
          setMsg({ kind: "ok", text: "알림을 켰어요!" });
        } else {
          setEnabled(false);
          setMsg({ kind: "err", text: reasonText(res.reason) });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function onTest() {
    setMsg(null);
    setBusy(true);
    try {
      const sub = await getExistingSubscription();
      if (!sub) {
        setMsg({ kind: "err", text: "먼저 알림을 켜주세요." });
        return;
      }
      const res = await sendTestPush(sub);
      setMsg(
        res.ok
          ? { kind: "ok", text: "테스트 알림을 보냈어요. 잠시 후 도착해요!" }
          : { kind: "err", text: res.reason ?? "전송 실패" },
      );
    } finally {
      setBusy(false);
    }
  }

  // ── Non-ready environments: explain, never break ────────────────────────
  if (env === "loading") {
    return <div className="card-premium h-28 animate-pulse" aria-hidden />;
  }
  if (env === "unsupported") {
    return (
      <Shell muted>
        <p className="text-[13px] text-foreground-muted">
          이 브라우저는 운동 알림을 지원하지 않아요. 크롬·사파리 최신 버전에서
          이용해주세요.
        </p>
      </Shell>
    );
  }
  if (env === "ios-install") {
    return (
      <Shell muted>
        <p className="text-[13px] text-foreground-muted">
          아이폰은 <b className="text-foreground">홈 화면에 앱을 추가</b>한 뒤에야
          알림을 받을 수 있어요. 사파리 공유 → ‘홈 화면에 추가’ 후 다시
          열어주세요.
        </p>
      </Shell>
    );
  }
  if (env === "unconfigured") {
    return (
      <Shell muted>
        <p className="text-[13px] text-foreground-muted">
          운동 알림은 곧 제공될 예정이에요. 조금만 기다려주세요!
        </p>
      </Shell>
    );
  }

  // ── Ready ───────────────────────────────────────────────────────────────
  return (
    <Shell active={enabled}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
            enabled ? "bg-accent/15 text-accent" : "bg-surface-2 text-foreground-muted",
          )}
        >
          {enabled ? <BellRing size={18} /> : <Bell size={18} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium">운동 리마인더</p>
          <p className="text-[12px] text-foreground-muted leading-snug mt-0.5">
            {enabled
              ? `매일 ${friendlyTime(hour, minute)}에 운동 알림을 보내드려요.`
              : "매일 정해진 시간에 ‘운동할 시간!’ 알림을 받아보세요."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="운동 알림 켜기/끄기"
          onClick={onToggle}
          disabled={busy}
          className={cn(
            "relative h-7 w-12 rounded-full shrink-0 transition-colors disabled:opacity-50",
            enabled ? "bg-accent" : "bg-surface-3",
          )}
        >
          <span
            className={cn(
              "absolute top-1 h-5 w-5 rounded-full bg-white transition-transform",
              enabled ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
      </div>

      {/* Time picker */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <label htmlFor="reminder-time" className="text-[13px] text-foreground-muted">
          알림 시간
        </label>
        <input
          id="reminder-time"
          type="time"
          value={timeValue}
          onChange={(e) => {
            const [h, m] = e.target.value.split(":").map(Number);
            if (!Number.isNaN(h) && !Number.isNaN(m)) setReminderTime(h, m);
          }}
          className="h-10 bg-surface-2 border border-border-subtle rounded-xl px-3 text-[14px] tabular-nums focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/30 transition-all [color-scheme:dark]"
        />
      </div>

      {enabled && (
        <button
          type="button"
          onClick={onTest}
          disabled={busy}
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-foreground-muted hover:text-foreground transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          테스트 알림 보내기
        </button>
      )}

      {msg && (
        <p
          className={cn(
            "mt-3 flex items-center gap-1.5 text-[12px]",
            msg.kind === "ok" ? "text-success" : "text-danger",
          )}
        >
          {msg.kind === "ok" ? <Check size={13} /> : <AlertCircle size={13} />}
          {msg.text}
        </p>
      )}
    </Shell>
  );
}

function Shell({
  children,
  active,
  muted,
}: {
  children: React.ReactNode;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "card-premium p-5",
        active && "border-accent/40 bg-accent/[0.04]",
        muted && "opacity-90",
      )}
    >
      {children}
    </div>
  );
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function friendlyTime(hour: number, minute: number): string {
  const ampm = hour < 12 ? "오전" : "오후";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0
    ? `${ampm} ${h12}시`
    : `${ampm} ${h12}시 ${pad(minute)}분`;
}

function reasonText(reason: "unsupported" | "unconfigured" | "denied" | "error"): string {
  switch (reason) {
    case "denied":
      return "알림 권한이 거부됐어요. 브라우저 설정에서 알림을 허용해주세요.";
    case "unsupported":
      return "이 브라우저는 알림을 지원하지 않아요.";
    case "unconfigured":
      return "알림 기능이 아직 준비 중이에요.";
    default:
      return "알림을 켜지 못했어요. 잠시 후 다시 시도해주세요.";
  }
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  UserRound,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { deleteAccount } from "@/lib/account";
import { Button } from "@/components/ui/button";
import {
  assertValidNickname,
  cleanNickname,
  getProfile,
  isNicknameAvailable,
  setNickname,
  NicknameInvalidError,
  NicknameTakenError,
  NICKNAME_MAX,
} from "@/lib/profile";
import { getFollowCounts, type FollowCounts } from "@/lib/follow";

type CheckState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

export function ProfileEditor() {
  const { state, configured, signInGoogle } = useAuth();

  if (!configured) {
    return (
      <Card>
        <p className="text-[14px] text-foreground-muted">
          Firebase가 설정되지 않아 프로필을 사용할 수 없어요.
        </p>
      </Card>
    );
  }
  if (state.status === "loading") {
    return (
      <Card>
        <div className="h-6 w-32 rounded bg-surface-2 animate-pulse" />
      </Card>
    );
  }
  if (state.status !== "signedIn") {
    return (
      <Card>
        <p className="text-[14px] text-foreground-muted">
          로그인하면 프로필을 수정할 수 있어요.
        </p>
        <Button className="mt-4" onClick={() => void signInGoogle()}>
          구글로 로그인
        </Button>
      </Card>
    );
  }

  return <Editor key={state.user.uid} />;
}

function Editor() {
  const { user } = useAuth();
  const uid = user!.uid;
  const photo = user!.photoURL;

  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState(""); // last saved nickname
  const [value, setValue] = useState("");
  const [check, setCheck] = useState<CheckState>({ kind: "idle" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [counts, setCounts] = useState<FollowCounts | null>(null);

  // Follower/following counts (one-shot aggregation; count() can't be live).
  useEffect(() => {
    let alive = true;
    getFollowCounts(uid)
      .then((c) => alive && setCounts(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [uid]);

  // Load the current nickname once.
  useEffect(() => {
    let alive = true;
    getProfile(uid)
      .then((p) => {
        if (!alive) return;
        const nick = p?.nickname ?? user!.displayName ?? user!.email ?? "";
        setCurrent(p?.nickname ?? "");
        setValue(nick);
        setLoaded(true);
      })
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [uid, user]);

  const clean = cleanNickname(value);
  const unchanged = clean === cleanNickname(current);

  // Debounced format + availability check whenever the value changes.
  const checkSeq = useRef(0);
  useEffect(() => {
    setSaved(false);
    if (!loaded) return;
    if (unchanged) {
      setCheck({ kind: "idle" });
      return;
    }
    try {
      assertValidNickname(value);
    } catch (err) {
      setCheck({
        kind: "error",
        message:
          err instanceof NicknameInvalidError ? err.message : "올바르지 않은 닉네임이에요.",
      });
      return;
    }
    setCheck({ kind: "checking" });
    const seq = ++checkSeq.current;
    const t = setTimeout(() => {
      isNicknameAvailable(clean, uid)
        .then((free) => {
          if (seq !== checkSeq.current) return; // stale
          setCheck(
            free
              ? { kind: "ok", message: "사용 가능한 닉네임이에요." }
              : { kind: "error", message: "이미 사용 중인 닉네임이에요." },
          );
        })
        .catch(() => {
          if (seq !== checkSeq.current) return;
          setCheck({ kind: "error", message: "확인 중 오류가 났어요." });
        });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, loaded, unchanged]);

  async function onSave() {
    if (saving || unchanged || check.kind === "checking") return;
    setSaving(true);
    setSaved(false);
    try {
      const savedNick = await setNickname(uid, value);
      setCurrent(savedNick);
      setValue(savedNick);
      setSaved(true);
      setCheck({ kind: "idle" });
    } catch (err) {
      console.error("[profile] setNickname failed:", err);
      const message =
        err instanceof NicknameTakenError || err instanceof NicknameInvalidError
          ? err.message
          : "저장에 실패했어요. 다시 시도해주세요.";
      setCheck({ kind: "error", message });
    } finally {
      setSaving(false);
    }
  }

  const initials = (value || "?").trim().slice(0, 1).toUpperCase();
  const canSave =
    loaded && !unchanged && !saving && check.kind !== "error" && check.kind !== "checking";

  return (
    <div className="flex flex-col gap-5">
    <Card>
      <div className="flex items-center gap-4">
        {photo ? (
          <Image
            src={photo}
            alt=""
            width={56}
            height={56}
            className="rounded-full object-cover"
            unoptimized
          />
        ) : (
          <span className="h-14 w-14 rounded-full bg-accent/15 text-accent flex items-center justify-center text-lg font-semibold">
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium truncate">{value || "—"}</p>
          {user!.email && (
            <p className="text-[12px] text-foreground-dim truncate">
              {user!.email}
            </p>
          )}
        </div>
        <div className="flex items-center gap-5 shrink-0 pr-1">
          <Stat label="팔로워" value={counts?.followers} />
          <Stat label="팔로잉" value={counts?.following} />
        </div>
      </div>

      <label className="mt-7 block text-[13px] font-medium text-foreground-muted">
        닉네임
      </label>
      <p className="mt-1 text-[12px] text-foreground-dim">
        커뮤니티에 표시되는 이름이에요. 바꾸면 예전에 쓴 글·댓글에도 모두 새 닉네임이 반영돼요.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <div className="relative flex-1">
          <UserRound
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-dim"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={NICKNAME_MAX}
            placeholder="닉네임 입력"
            disabled={!loaded}
            className="w-full h-11 bg-surface-2 border border-border-subtle rounded-xl pl-10 pr-3 text-[14px] placeholder:text-foreground-dim focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/30 transition-all"
          />
        </div>
        <Button onClick={() => void onSave()} disabled={!canSave}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : "저장"}
        </Button>
      </div>

      <div className="mt-2.5 min-h-[20px] text-[12px]">
        {saved ? (
          <span className="inline-flex items-center gap-1.5 text-accent">
            <Check size={13} /> 닉네임을 변경했어요.
          </span>
        ) : check.kind === "checking" ? (
          <span className="inline-flex items-center gap-1.5 text-foreground-dim">
            <Loader2 size={13} className="animate-spin" /> 확인 중…
          </span>
        ) : check.kind === "ok" ? (
          <span className="inline-flex items-center gap-1.5 text-accent">
            <Check size={13} /> {check.message}
          </span>
        ) : check.kind === "error" ? (
          <span className="inline-flex items-center gap-1.5 text-danger">
            <AlertCircle size={13} /> {check.message}
          </span>
        ) : null}
      </div>
    </Card>

    <AccountDeleteCard />
    </div>
  );
}

// Danger zone: permanently delete the account + all personal data. Required by
// Google Play for apps with sign-in.
function AccountDeleteCard() {
  const { user } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "confirm" | "deleting" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onDelete() {
    if (!user || phase === "deleting") return;
    setPhase("deleting");
    try {
      await deleteAccount(user);
      // Auth state flips to signed-out on its own; leave the profile page.
      router.replace("/");
    } catch (err) {
      console.error("[account] delete failed:", err);
      const code = (err as { code?: string }).code;
      setMessage(
        code === "auth/popup-closed-by-user" ||
          code === "auth/cancelled-popup-request"
          ? "재인증이 취소됐어요. 다시 시도해주세요."
          : "삭제에 실패했어요. 다시 로그인한 뒤 시도하거나 문의해주세요.",
      );
      setPhase("error");
    }
  }

  const busy = phase === "deleting";

  return (
    <Card>
      <div className="flex items-center gap-2 text-danger">
        <AlertTriangle size={16} />
        <h3 className="text-[14px] font-semibold">계정 삭제</h3>
      </div>
      <p className="mt-2 text-[13px] text-foreground-muted leading-relaxed">
        계정을 삭제하면 프로필·닉네임·운동 기록·루틴·작성한 글·팔로우·알림이
        모두 영구 삭제돼요. 되돌릴 수 없어요.
      </p>
      <Link
        href="/account-deletion"
        className="mt-1.5 inline-block text-[12px] text-foreground-dim underline underline-offset-2 hover:text-foreground"
      >
        삭제되는 데이터 자세히 보기
      </Link>

      {phase === "error" && (
        <p className="mt-3 flex items-start gap-1.5 text-[12px] text-danger">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          {message}
        </p>
      )}

      {phase === "confirm" || phase === "deleting" ? (
        <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/10 p-4">
          <p className="text-[13px] text-foreground">
            정말 계정을 삭제할까요? 이 작업은 되돌릴 수 없어요.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="h-10 px-4 rounded-xl text-[13px] font-semibold bg-danger text-white hover:brightness-110 transition-all disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              {busy ? "삭제 중…" : "영구 삭제"}
            </button>
            <button
              type="button"
              onClick={() => setPhase("idle")}
              disabled={busy}
              className="h-10 px-4 rounded-xl text-[13px] font-medium bg-surface-2 text-foreground-muted hover:bg-surface-3 transition-colors disabled:opacity-60"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setPhase("confirm");
            setMessage("");
          }}
          className="mt-4 h-10 px-4 rounded-xl text-[13px] font-semibold border border-danger/40 text-danger hover:bg-danger/10 transition-colors"
        >
          계정 삭제
        </button>
      )}
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card-premium p-6 sm:p-8">{children}</div>;
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="text-center">
      <p className="text-[17px] font-semibold tabular-nums leading-none">
        {value ?? "—"}
      </p>
      <p className="mt-1 text-[11px] text-foreground-dim">{label}</p>
    </div>
  );
}

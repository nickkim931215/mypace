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
  updateProfileMeta,
  NicknameInvalidError,
  NicknameTakenError,
  NICKNAME_MAX,
  NICKNAME_MIN,
  AGE_RANGES,
  AGE_RANGE_LABEL,
  AGE_RANGE_LABEL_EN,
  GENDERS,
  GENDER_LABEL,
  GENDER_LABEL_EN,
  type AgeRange,
  type Gender,
} from "@/lib/profile";
import { cn } from "@/lib/utils";
import { useT, useLocale, type TranslateFn } from "@/lib/i18n";
import { getFollowCounts, type FollowCounts } from "@/lib/follow";
import { UserSearch } from "@/components/community/user-search";

// Map a thrown nickname error to a localized message. Uses stable reason codes
// (and the typed taken/invalid errors) so the copy follows the active locale
// rather than echoing the raw Korean `err.message`.
function nicknameErrorMessage(err: unknown, t: TranslateFn): string {
  if (err instanceof NicknameTakenError) {
    return t("이미 사용 중인 닉네임이에요.", "That nickname is already taken.");
  }
  if (err instanceof NicknameInvalidError) {
    switch (err.code) {
      case "too_short":
        return t(
          `닉네임은 ${NICKNAME_MIN}자 이상이어야 해요.`,
          `Nickname must be at least ${NICKNAME_MIN} characters.`,
        );
      case "too_long":
        return t(
          `닉네임은 ${NICKNAME_MAX}자 이하여야 해요.`,
          `Nickname must be at most ${NICKNAME_MAX} characters.`,
        );
      case "bad_chars":
        return t(
          "한글·영문·숫자와 _ . - 만 사용할 수 있어요.",
          "Only letters, numbers, and _ . - are allowed.",
        );
    }
  }
  return t("올바르지 않은 닉네임이에요.", "That nickname isn't valid.");
}

type CheckState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

export function ProfileEditor() {
  const t = useT();
  const { state, configured, signInGoogle } = useAuth();

  if (!configured) {
    return (
      <Card>
        <p className="text-[14px] text-foreground-muted">
          {t(
            "Firebase가 설정되지 않아 프로필을 사용할 수 없어요.",
            "Firebase isn't configured, so profiles aren't available.",
          )}
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
          {t("로그인하면 프로필을 수정할 수 있어요.", "Sign in to edit your profile.")}
        </p>
        <Button className="mt-4" onClick={() => void signInGoogle()}>
          {t("구글로 로그인", "Sign in with Google")}
        </Button>
      </Card>
    );
  }

  return <Editor key={state.user.uid} />;
}

function Editor() {
  const t = useT();
  const { locale } = useLocale();
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
  const [ageRange, setAgeRange] = useState<AgeRange | undefined>(undefined);
  const [gender, setGender] = useState<Gender | undefined>(undefined);

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
        setAgeRange(p?.ageRange);
        setGender(p?.gender);
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
        message: nicknameErrorMessage(err, t),
      });
      return;
    }
    setCheck({ kind: "checking" });
    const seq = ++checkSeq.current;
    const timer = setTimeout(() => {
      isNicknameAvailable(clean, uid)
        .then((free) => {
          if (seq !== checkSeq.current) return; // stale
          setCheck(
            free
              ? {
                  kind: "ok",
                  message: t(
                    "사용 가능한 닉네임이에요.",
                    "That nickname is available.",
                  ),
                }
              : {
                  kind: "error",
                  message: t(
                    "이미 사용 중인 닉네임이에요.",
                    "That nickname is already taken.",
                  ),
                },
          );
        })
        .catch(() => {
          if (seq !== checkSeq.current) return;
          setCheck({
            kind: "error",
            message: t("확인 중 오류가 났어요.", "Something went wrong while checking."),
          });
        });
    }, 400);
    return () => clearTimeout(timer);
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
          ? nicknameErrorMessage(err, t)
          : t("저장에 실패했어요. 다시 시도해주세요.", "Couldn't save. Please try again.");
      setCheck({ kind: "error", message });
    } finally {
      setSaving(false);
    }
  }

  // Demographics save instantly (optimistic) on selection; revert on failure.
  async function chooseAge(a: AgeRange) {
    if (a === ageRange) return;
    const prev = ageRange;
    setAgeRange(a);
    try {
      await updateProfileMeta(uid, { ageRange: a });
    } catch {
      setAgeRange(prev);
    }
  }
  async function chooseGender(g: Gender) {
    if (g === gender) return;
    const prev = gender;
    setGender(g);
    try {
      await updateProfileMeta(uid, { gender: g });
    } catch {
      setGender(prev);
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
          <Stat label={t("팔로워", "Followers")} value={counts?.followers} />
          <Stat label={t("팔로잉", "Following")} value={counts?.following} />
        </div>
      </div>

      <label className="mt-7 block text-[13px] font-medium text-foreground-muted">
        {t("닉네임", "Nickname")}
      </label>
      <p className="mt-1 text-[12px] text-foreground-dim">
        {t(
          "커뮤니티에 표시되는 이름이에요. 바꾸면 예전에 쓴 글·댓글에도 모두 새 닉네임이 반영돼요.",
          "This is the name shown in the community. Changing it updates your old posts and comments too.",
        )}
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
            placeholder={t("닉네임 입력", "Enter a nickname")}
            disabled={!loaded}
            className="w-full h-11 bg-surface-2 border border-border-subtle rounded-xl pl-10 pr-3 text-[14px] placeholder:text-foreground-dim focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/30 transition-all"
          />
        </div>
        <Button onClick={() => void onSave()} disabled={!canSave}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : t("저장", "Save")}
        </Button>
      </div>

      <div className="mt-2.5 min-h-[20px] text-[12px]">
        {saved ? (
          <span className="inline-flex items-center gap-1.5 text-accent">
            <Check size={13} /> {t("닉네임을 변경했어요.", "Nickname updated.")}
          </span>
        ) : check.kind === "checking" ? (
          <span className="inline-flex items-center gap-1.5 text-foreground-dim">
            <Loader2 size={13} className="animate-spin" /> {t("확인 중…", "Checking…")}
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

      {/* Demographics — shown on your public profile. Optional. */}
      <div className="mt-7 border-t border-border-subtle pt-6">
        <p className="text-[13px] font-medium text-foreground-muted">
          {t("연령대", "Age range")}
        </p>
        <p className="mt-1 text-[12px] text-foreground-dim">
          {t(
            "공개 프로필에 표시돼요. 선택 시 바로 저장돼요.",
            "Shown on your public profile. Saved as soon as you select.",
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {AGE_RANGES.map((a) => (
            <Chip
              key={a}
              active={ageRange === a}
              disabled={!loaded}
              onClick={() => void chooseAge(a)}
            >
              {locale === "en" ? AGE_RANGE_LABEL_EN[a] : AGE_RANGE_LABEL[a]}
            </Chip>
          ))}
        </div>

        <p className="mt-5 text-[13px] font-medium text-foreground-muted">
          {t("성별", "Gender")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <Chip
              key={g}
              active={gender === g}
              disabled={!loaded}
              onClick={() => void chooseGender(g)}
            >
              {locale === "en" ? GENDER_LABEL_EN[g] : GENDER_LABEL[g]}
            </Chip>
          ))}
        </div>
      </div>
    </Card>

    <UserSearch title={t("닉네임으로 친구찾기", "Find friends by nickname")} />

    <AccountDeleteCard />
    </div>
  );
}

// Danger zone: permanently delete the account + all personal data. Required by
// Google Play for apps with sign-in.
function AccountDeleteCard() {
  const t = useT();
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
          ? t(
              "재인증이 취소됐어요. 다시 시도해주세요.",
              "Re-authentication was cancelled. Please try again.",
            )
          : t(
              "삭제에 실패했어요. 다시 로그인한 뒤 시도하거나 문의해주세요.",
              "Deletion failed. Sign in again and retry, or contact us.",
            ),
      );
      setPhase("error");
    }
  }

  const busy = phase === "deleting";

  return (
    <Card>
      <div className="flex items-center gap-2 text-danger">
        <AlertTriangle size={16} />
        <h3 className="text-[14px] font-semibold">{t("계정 삭제", "Delete account")}</h3>
      </div>
      <p className="mt-2 text-[13px] text-foreground-muted leading-relaxed">
        {t(
          "계정을 삭제하면 프로필·닉네임·운동 기록·루틴·작성한 글·팔로우·알림이 모두 영구 삭제돼요. 되돌릴 수 없어요.",
          "Deleting your account permanently removes your profile, nickname, workout records, routines, posts, follows, and notifications. This can't be undone.",
        )}
      </p>
      <Link
        href="/account-deletion"
        className="mt-1.5 inline-block text-[12px] text-foreground-dim underline underline-offset-2 hover:text-foreground"
      >
        {t("삭제되는 데이터 자세히 보기", "See what data gets deleted")}
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
            {t(
              "정말 계정을 삭제할까요? 이 작업은 되돌릴 수 없어요.",
              "Really delete your account? This can't be undone.",
            )}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="h-10 px-4 rounded-xl text-[13px] font-semibold bg-danger text-white hover:brightness-110 transition-all disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              {busy ? t("삭제 중…", "Deleting…") : t("영구 삭제", "Delete permanently")}
            </button>
            <button
              type="button"
              onClick={() => setPhase("idle")}
              disabled={busy}
              className="h-10 px-4 rounded-xl text-[13px] font-medium bg-surface-2 text-foreground-muted hover:bg-surface-3 transition-colors disabled:opacity-60"
            >
              {t("취소", "Cancel")}
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
          {t("계정 삭제", "Delete account")}
        </button>
      )}
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card-premium p-6 sm:p-8">{children}</div>;
}

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "h-9 px-4 rounded-full text-[13px] font-medium transition-colors disabled:opacity-50",
        active
          ? "bg-accent text-background"
          : "bg-surface-2 text-foreground-muted hover:text-foreground border border-border-subtle",
      )}
    >
      {children}
    </button>
  );
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

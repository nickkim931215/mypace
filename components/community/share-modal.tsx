"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Share2, Loader2, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useTimerStore } from "@/store/timer-store";
import { createPost, extractYoutubeId } from "@/lib/community";
import { trackEvent } from "@/lib/analytics";
import { BODY_PART_LABEL, type BodyPart } from "@/lib/ai-recommend";
import { formatDuration, cn } from "@/lib/utils";
import type { Routine } from "@/lib/types";
import { useT, type TranslateFn } from "@/lib/i18n";

const BODY_PARTS = Object.keys(BODY_PART_LABEL) as BodyPart[];

const BODY_PART_LABEL_EN: Record<BodyPart, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  arms: "Arms",
  core: "Core",
  legs: "Legs",
  full: "Full body",
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

export function ShareModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const t = useT();
  const routines = useTimerStore((s) => s.routines);
  const currentRoutineId = useTimerStore((s) => s.currentRoutineId);

  const initialId = currentRoutineId ?? routines[0]?.id ?? "";
  const initialRoutine = routines.find((r) => r.id === initialId);
  const [routineId, setRoutineId] = useState<string>(initialId);
  const [title, setTitle] = useState(initialRoutine?.name ?? "");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function toggleBodyPart(part: BodyPart) {
    setBodyParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part],
    );
  }

  const selected: Routine | undefined = useMemo(
    () => routines.find((r) => r.id === routineId),
    [routines, routineId],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ytTouched = youtubeUrl.length > 0;
  const ytId = ytTouched ? extractYoutubeId(youtubeUrl) : null;
  const ytValid = !ytTouched || ytId !== null;

  const canSubmit =
    !!user &&
    !!selected &&
    title.trim().length > 0 &&
    ytValid &&
    status.kind !== "submitting";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selected || !user) return;
    setStatus({ kind: "submitting" });
    try {
      await createPost({
        authorId: user.uid,
        authorName: user.displayName ?? user.email ?? t("익명", "Anonymous"),
        authorPhotoURL: user.photoURL ?? null,
        title: title.trim(),
        description: description.trim(),
        youtubeUrl: youtubeUrl.trim() || null,
        bodyParts,
        routine: selected,
      });
      trackEvent("post_created", { kind: "routine" });
      onClose();
    } catch (err) {
      console.error("[community] createPost failed:", err);
      setStatus({
        kind: "error",
        message: t(
          "게시물 작성 중 오류가 발생했습니다.",
          "Something went wrong while creating the post.",
        ),
      });
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full sm:max-w-xl max-h-[92dvh] sm:max-h-[88dvh] bg-surface-1 border border-border-subtle sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("닫기", "Close")}
          className="absolute right-3 top-3 z-20 h-9 w-9 rounded-full bg-surface-2 hover:bg-surface-3 flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>

        <div className="overflow-y-auto overscroll-contain">
        <div className="px-5 sm:px-8 pt-7 pb-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
            Share
          </span>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
            {t("루틴 공유하기", "Share routine")}
          </h2>
          <p className="mt-1.5 text-[13px] text-foreground-muted">
            {t(
              "내가 만든 인터벌 루틴을 다른 사람도 한 번에 가져갈 수 있어요.",
              "Let others grab the interval routine you made in one tap.",
            )}
          </p>
        </div>

        <form onSubmit={onSubmit} className="px-5 sm:px-8 pb-[max(2rem,env(safe-area-inset-bottom))] flex flex-col gap-6">
          <Section label={t("루틴 선택", "Select routine")}>
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              {routines.map((r) => (
                <RoutineOption
                  key={r.id}
                  routine={r}
                  selected={r.id === routineId}
                  onSelect={() => setRoutineId(r.id)}
                  t={t}
                />
              ))}
              {routines.length === 0 && (
                <p className="text-[13px] text-foreground-dim">
                  {t("먼저 빌더에서 루틴을 만들어주세요.", "Create a routine in the builder first.")}
                </p>
              )}
            </div>
          </Section>

          <Section label={t("제목", "Title")}>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              required
              placeholder={t("예: 출근 전 10분 코어 루틴", "e.g. 10-min core routine before work")}
            />
          </Section>

          <Section label={t("운동 부위", "Body part")} hint={t("선택 — 여러 개 가능", "Optional — pick multiple")}>
            <div className="flex flex-wrap gap-2">
              {BODY_PARTS.map((part) => {
                const on = bodyParts.includes(part);
                return (
                  <button
                    key={part}
                    type="button"
                    onClick={() => toggleBodyPart(part)}
                    className={cn(
                      "h-9 px-4 rounded-full border text-[13px] transition-colors",
                      on
                        ? "border-accent/50 bg-accent/15 text-accent"
                        : "border-border-subtle bg-surface-2 text-foreground-muted hover:border-border-strong",
                    )}
                  >
                    {t(BODY_PART_LABEL[part], BODY_PART_LABEL_EN[part])}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section label={t("설명", "Description")} hint={t("선택", "Optional")}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={t("이 루틴을 어떤 사람이 어떻게 쓰면 좋을지 적어주세요.", "Describe who this routine is for and how to use it.")}
              className="w-full bg-surface-2 border border-border-subtle rounded-2xl px-4 py-3 text-[13px] placeholder:text-foreground-dim focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/30 transition-all resize-none"
            />
          </Section>

          <Section label="YouTube URL" hint={t("선택 — 시범 영상이 있다면", "Optional — if you have a demo video")}>
            <Input
              type="url"
              inputMode="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              invalid={ytTouched && !ytValid}
            />
            {ytTouched && !ytValid && (
              <p className="mt-2 text-[12px] text-danger">
                {t("올바른 YouTube 링크를 입력해주세요.", "Please enter a valid YouTube link.")}
              </p>
            )}
          </Section>

          {!user && (
            <p className="text-[12px] text-danger flex items-center gap-2">
              <AlertCircle size={13} />
              {t("공유하려면 먼저 로그인해주세요.", "Please sign in first to share.")}
            </p>
          )}

          {status.kind === "error" && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-[13px]">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {status.message}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!canSubmit}
            className="self-stretch sm:self-start"
          >
            {status.kind === "submitting" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Share2 size={15} />
            )}
            {status.kind === "submitting"
              ? t("게시 중...", "Posting...")
              : t("게시하기", "Post")}
          </Button>
        </form>
        </div>
      </div>
    </div>
  );
}

function RoutineOption({
  routine,
  selected,
  onSelect,
  t,
}: {
  routine: Routine;
  selected: boolean;
  onSelect: () => void;
  t: TranslateFn;
}) {
  const total = routine.totalDurationSec * routine.repeat;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors",
        selected
          ? "border-accent/50 bg-accent/10"
          : "border-border-subtle bg-surface-2 hover:border-border-strong",
      )}
    >
      <span
        className={cn(
          "h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center",
          selected ? "border-accent bg-accent" : "border-border-strong",
        )}
      >
        {selected && <Check size={12} className="text-background" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium truncate">{routine.name}</p>
        <p className="text-[11px] text-foreground-dim">
          {t(`${routine.rounds.length}개 라운드`, `${routine.rounds.length} rounds`)} · {formatDuration(total)}
        </p>
      </div>
    </button>
  );
}

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className="text-[11px] uppercase tracking-[0.18em] text-foreground-dim">
          {label}
        </span>
        {hint && (
          <span className="text-[11px] text-foreground-dim">— {hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Input({
  invalid,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      className={cn(
        "h-12 w-full bg-surface-2 border rounded-full px-5 text-[14px] placeholder:text-foreground-dim focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all",
        invalid
          ? "border-danger/60"
          : "border-border-subtle focus:border-border-strong",
        className,
      )}
    />
  );
}

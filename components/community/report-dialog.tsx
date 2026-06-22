"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  submitReport,
  REPORT_REASONS,
  type ReportReason,
  type ReportTargetType,
} from "@/lib/moderation";
import { cn } from "@/lib/utils";
import { useT, useLocale, type TranslateFn } from "@/lib/i18n";

function targetLabel(t: TranslateFn): Record<ReportTargetType, string> {
  return {
    post: t("게시물", "Post"),
    comment: t("댓글", "Comment"),
    user: t("사용자", "User"),
  };
}

// Reason-picker modal for reporting a post, comment, or user. Files one doc to
// /reports and shows a confirmation. Sits above the post detail modal (z-60).
export function ReportDialog({
  targetType,
  targetId,
  authorId,
  postId,
  onClose,
}: {
  targetType: ReportTargetType;
  targetId: string;
  authorId: string | null;
  postId?: string | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const targetLabels = targetLabel(t);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit() {
    if (!user || !reason || busy) return;
    setBusy(true);
    try {
      await submitReport({
        reporterId: user.uid,
        targetType,
        targetId,
        authorId: authorId ?? null,
        postId: postId ?? null,
        reason,
        detail,
      });
      setDone(true);
    } catch (err) {
      console.error("[moderation] submitReport failed:", err);
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md bg-surface-1 border border-border-subtle sm:rounded-3xl rounded-t-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("닫기", "Close")}
          className="absolute right-3 top-3 h-9 w-9 rounded-full hover:bg-surface-2 text-foreground-dim hover:text-foreground transition-colors flex items-center justify-center"
        >
          <X size={16} />
        </button>

        {done ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="h-12 w-12 rounded-full bg-accent/15 text-accent flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">
              {t("신고가 접수되었어요", "Your report has been received")}
            </h3>
            <p className="mt-2 text-[13px] text-foreground-muted leading-relaxed max-w-xs">
              {t(
                "검토 후 가이드라인에 어긋나는 콘텐츠는 조치할게요. 해당 사용자를 차단하면 더 이상 콘텐츠가 보이지 않아요.",
                "After review, we'll take action on content that violates our guidelines. If you block this user, you'll no longer see their content.",
              )}
            </p>
            <Button
              variant="primary"
              size="md"
              className="mt-6"
              onClick={onClose}
            >
              {t("확인", "OK")}
            </Button>
          </div>
        ) : (
          <>
            <h3 className="font-display text-xl font-semibold tracking-tight pr-8">
              {t(
                `${targetLabels[targetType]} 신고`,
                `Report ${targetLabels[targetType]}`,
              )}
            </h3>
            <p className="mt-1.5 text-[13px] text-foreground-muted">
              {t("신고 사유를 선택해 주세요. 어떤 콘텐츠가 금지되는지는", "Please choose a reason for reporting. You can find what content is prohibited in our")}{" "}
              <Link
                href="/terms"
                target="_blank"
                className="text-accent underline underline-offset-2"
              >
                {t("커뮤니티 가이드라인", "community guidelines")}
              </Link>
              {t("에서 확인할 수 있어요.", ".")}
            </p>

            <div className="mt-4 flex flex-col gap-1.5">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setReason(r.key)}
                  className={cn(
                    "flex items-center justify-between h-11 px-4 rounded-xl border text-[14px] text-left transition-colors",
                    reason === r.key
                      ? "border-accent/50 bg-accent/12 text-accent"
                      : "border-border-subtle bg-surface-2 text-foreground-muted hover:border-border-strong",
                  )}
                >
                  {locale === "en" ? r.labelEn : r.label}
                  <span
                    className={cn(
                      "h-4 w-4 rounded-full border-2 transition-colors",
                      reason === r.key
                        ? "border-accent bg-accent"
                        : "border-border-strong",
                    )}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={t("자세한 내용 (선택)", "Details (optional)")}
              maxLength={500}
              rows={3}
              className="mt-3 w-full bg-surface-2 border border-border-subtle rounded-xl px-4 py-3 text-[13px] leading-relaxed resize-y focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/30 transition-all"
            />

            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={onSubmit}
                disabled={!reason || busy}
              >
                {busy && <Loader2 size={15} className="animate-spin" />}
                {t("신고하기", "Report")}
              </Button>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="h-11 px-4 rounded-full text-[13px] text-foreground-muted hover:text-foreground hover:bg-surface-2 transition-colors disabled:opacity-50"
              >
                {t("취소", "Cancel")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

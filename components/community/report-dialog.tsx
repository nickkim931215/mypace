"use client";

import { useEffect, useState } from "react";
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

const TARGET_LABEL: Record<ReportTargetType, string> = {
  post: "게시물",
  comment: "댓글",
  user: "사용자",
};

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
          aria-label="닫기"
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
              신고가 접수되었어요
            </h3>
            <p className="mt-2 text-[13px] text-foreground-muted leading-relaxed max-w-xs">
              검토 후 가이드라인에 어긋나는 콘텐츠는 조치할게요. 해당 사용자를
              차단하면 더 이상 콘텐츠가 보이지 않아요.
            </p>
            <Button
              variant="primary"
              size="md"
              className="mt-6"
              onClick={onClose}
            >
              확인
            </Button>
          </div>
        ) : (
          <>
            <h3 className="font-display text-xl font-semibold tracking-tight pr-8">
              {TARGET_LABEL[targetType]} 신고
            </h3>
            <p className="mt-1.5 text-[13px] text-foreground-muted">
              신고 사유를 선택해 주세요.
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
                  {r.label}
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
              placeholder="자세한 내용 (선택)"
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
                신고하기
              </Button>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="h-11 px-4 rounded-full text-[13px] text-foreground-muted hover:text-foreground hover:bg-surface-2 transition-colors disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

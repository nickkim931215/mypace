"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Trophy,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useTimerStore } from "@/store/timer-store";
import { createRecordPost } from "@/lib/community";
import { trackEvent } from "@/lib/analytics";
import { buildRecordSnapshot, startOfDay } from "@/lib/history";
import { RecordCalendarCard } from "./record-calendar-card";
import { cn } from "@/lib/utils";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

export function RecordShareModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const completions = useTimerStore((s) => s.completions);

  const today = useMemo(() => startOfDay(new Date()), []);
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));

  const snapshot = useMemo(
    () => buildRecordSnapshot(completions, cursor.year, cursor.month),
    [completions, cursor],
  );

  const [title, setTitle] = useState(
    `${today.getMonth() + 1}월 운동 기록 🔥`,
  );
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isCurrentMonth =
    cursor.year === today.getFullYear() && cursor.month === today.getMonth();
  const empty = completions.length === 0;

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const canSubmit =
    !!user && !empty && title.trim().length > 0 && status.kind !== "submitting";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !user) return;
    setStatus({ kind: "submitting" });
    try {
      await createRecordPost({
        authorId: user.uid,
        authorName: user.displayName ?? user.email ?? "익명",
        authorPhotoURL: user.photoURL ?? null,
        title: title.trim(),
        description: description.trim(),
        record: snapshot,
      });
      trackEvent("post_created", { kind: "record" });
      onClose();
    } catch (err) {
      console.error("[community] createRecordPost failed:", err);
      setStatus({
        kind: "error",
        message: "기록 공유 중 오류가 발생했습니다.",
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
          aria-label="닫기"
          className="absolute right-3 top-3 z-20 h-9 w-9 rounded-full bg-surface-2 hover:bg-surface-3 flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>

        <div className="overflow-y-auto overscroll-contain">
          <div className="px-5 sm:px-8 pt-7 pb-2">
            <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
              Brag
            </span>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
              내 기록 자랑하기
            </h2>
            <p className="mt-1.5 text-[13px] text-foreground-muted">
              지금까지의 운동 기록을 캡처해서 커뮤니티에 공유해요. 공유 후
              운동을 더 해도 이 카드는 그대로 박제돼요.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="px-5 sm:px-8 pb-[max(2rem,env(safe-area-inset-bottom))] flex flex-col gap-6 pt-4"
          >
            {/* Month picker */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="이전 달"
                className="h-9 w-9 rounded-full hover:bg-surface-2 flex items-center justify-center text-foreground-muted transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-[13px] font-medium">{snapshot.monthLabel}</span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                disabled={isCurrentMonth}
                aria-label="다음 달"
                className="h-9 w-9 rounded-full hover:bg-surface-2 flex items-center justify-center text-foreground-muted transition-colors disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Live preview of the snapshot card */}
            <div className="card-premium p-4">
              <RecordCalendarCard record={snapshot} />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-foreground-dim">
                제목
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                required
                placeholder="예: 이번 달도 꾸준히 완료!"
                className="h-12 w-full bg-surface-2 border border-border-subtle rounded-full px-5 text-[14px] placeholder:text-foreground-dim focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/30 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] uppercase tracking-[0.18em] text-foreground-dim">
                  한마디
                </span>
                <span className="text-[11px] text-foreground-dim">— 선택</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="이번 달 운동하면서 느낀 점을 적어보세요."
                className="w-full bg-surface-2 border border-border-subtle rounded-2xl px-4 py-3 text-[13px] placeholder:text-foreground-dim focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/30 transition-all resize-none"
              />
            </div>

            {empty && (
              <p className="text-[12px] text-danger flex items-center gap-2">
                <AlertCircle size={13} />
                아직 완료한 운동이 없어요. 먼저 루틴을 완료해보세요.
              </p>
            )}
            {!user && (
              <p className="text-[12px] text-danger flex items-center gap-2">
                <AlertCircle size={13} />
                공유하려면 먼저 로그인해주세요.
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
              className={cn("self-stretch sm:self-start")}
            >
              {status.kind === "submitting" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Trophy size={15} />
              )}
              {status.kind === "submitting" ? "공유 중..." : "기록 공유하기"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

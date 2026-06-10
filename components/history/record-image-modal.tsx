"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  X,
  Share2,
  Download,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useTimerStore } from "@/store/timer-store";
import { useProfileName } from "@/hooks/use-profile-name";
import { buildRecordSnapshot, startOfDay } from "@/lib/history";
import { renderRecordCard } from "@/lib/record-image";

export function RecordImageModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const completions = useTimerStore((s) => s.completions);
  const nickname = useProfileName(
    user?.uid,
    user?.displayName ?? user?.email?.split("@")[0] ?? "mypace",
  );

  const today = useMemo(() => startOfDay(new Date()), []);
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));

  const snapshot = useMemo(
    () => buildRecordSnapshot(completions, cursor.year, cursor.month),
    [completions, cursor],
  );

  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  // Re-render the card whenever the selected month changes.
  useEffect(() => {
    let alive = true;
    let url: string | null = null;
    setRendering(true);
    setError(null);
    setShared(false);
    renderRecordCard(snapshot, nickname)
      .then((b) => {
        if (!alive) return;
        url = URL.createObjectURL(b);
        setBlob(b);
        setImgUrl(url);
        setRendering(false);
      })
      .catch((err) => {
        console.error("[record-image] render failed:", err);
        if (!alive) return;
        setError("이미지를 만들지 못했어요.");
        setRendering(false);
      });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [snapshot, nickname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fileName = `mypace-${snapshot.year}-${String(snapshot.month + 1).padStart(2, "0")}.png`;

  const onShare = useCallback(async () => {
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    const shareData = {
      files: [file],
      title: "MyPace 운동 기록",
      text: `${snapshot.monthLabel} ${snapshot.monthCount}회 운동 · ${snapshot.streak}일 연속 🔥`,
    };
    // Prefer native share sheet (KakaoTalk / Instagram / etc.) on mobile.
    if (
      typeof navigator !== "undefined" &&
      navigator.canShare?.(shareData)
    ) {
      try {
        await navigator.share(shareData);
        setShared(true);
        return;
      } catch (err) {
        // User cancelled the sheet — not an error worth surfacing.
        if ((err as Error)?.name === "AbortError") return;
        console.error("[record-image] share failed:", err);
      }
    }
    // Fallback: download the PNG.
    downloadBlob(blob, fileName);
    setShared(true);
  }, [blob, fileName, snapshot]);

  const onDownload = useCallback(() => {
    if (!blob) return;
    downloadBlob(blob, fileName);
    setShared(true);
  }, [blob, fileName]);

  const isCurrentMonth =
    cursor.year === today.getFullYear() && cursor.month === today.getMonth();

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full sm:max-w-md max-h-[94dvh] sm:max-h-[90dvh] bg-surface-1 border border-border-subtle sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl"
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

        <div className="overflow-y-auto overscroll-contain px-5 sm:px-7 pt-7 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
            Share
          </span>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
            기록 이미지로 공유
          </h2>
          <p className="mt-1.5 text-[13px] text-foreground-muted">
            이번 달 운동 기록을 카드 이미지로 만들어 카카오톡·인스타그램에
            바로 공유해요.
          </p>

          {/* Month picker */}
          <div className="mt-5 flex items-center justify-between">
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

          {/* Preview */}
          <div className="mt-4 rounded-2xl overflow-hidden border border-border-subtle bg-background aspect-[1080/1350] relative">
            {imgUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt="운동 기록 카드 미리보기"
                className="w-full h-full object-contain"
              />
            )}
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center text-foreground-dim">
                <Loader2 size={22} className="animate-spin" />
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-[13px]">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2.5">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={onShare}
              disabled={rendering || !blob}
            >
              {shared ? <Check size={16} /> : <Share2 size={16} />}
              {shared ? "공유 완료" : "공유하기"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onDownload}
              disabled={rendering || !blob}
            >
              <Download size={15} />
              이미지 저장
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

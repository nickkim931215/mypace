"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  X,
  Share2,
  Download,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useTimerStore } from "@/store/timer-store";
import { useProfileName } from "@/hooks/use-profile-name";
import { getLevel } from "@/lib/level";
import { renderCompletionCard, type CompletionCardData } from "@/lib/completion-image";
import { trackEvent } from "@/lib/analytics";
import { useT, useLocale } from "@/lib/i18n";

export function CompletionShareModal({
  data,
  onClose,
}: {
  data: CompletionCardData;
  onClose: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const { user } = useAuth();
  const completions = useTimerStore((s) => s.completions);
  const nickname = useProfileName(
    user?.uid,
    user?.displayName ?? user?.email?.split("@")[0] ?? "mypace",
  );
  const level = useMemo(() => getLevel(completions.length).level, [completions]);

  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let alive = true;
    let url: string | null = null;
    setRendering(true);
    setError(null);
    renderCompletionCard(data, nickname, level, locale)
      .then((b) => {
        if (!alive) return;
        url = URL.createObjectURL(b);
        setBlob(b);
        setImgUrl(url);
        setRendering(false);
      })
      .catch((err) => {
        console.error("[completion-image] render failed:", err);
        if (!alive) return;
        setError(t("이미지를 만들지 못했어요.", "Couldn't create the image."));
        setRendering(false);
      });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [data, nickname, level, locale, t]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fileName = `mypace-workout-${data.dateMs}.png`;

  const onShare = useCallback(async () => {
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    const shareData = {
      files: [file],
      title: t("MyPace 운동 완료", "MyPace workout complete"),
      text: t(
        `${data.routineName} 완료! 🔥`,
        `Finished ${data.routineName}! 🔥`,
      ),
    };
    if (typeof navigator !== "undefined" && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        setShared(true);
        trackEvent("completion_shared", { method: "share" });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("[completion-image] share failed:", err);
      }
    }
    downloadBlob(blob, fileName);
    setShared(true);
    trackEvent("completion_shared", { method: "download" });
  }, [blob, fileName, data, t]);

  const onDownload = useCallback(() => {
    if (!blob) return;
    downloadBlob(blob, fileName);
    setShared(true);
  }, [blob, fileName]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full sm:max-w-md max-h-[94dvh] sm:max-h-[90dvh] bg-surface-1 border border-border-subtle sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl"
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

        <div className="overflow-y-auto overscroll-contain px-5 sm:px-7 pt-7 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
            Share
          </span>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
            {t("오늘 운동 자랑하기", "Share today's workout")}
          </h2>
          <p className="mt-1.5 text-[13px] text-foreground-muted">
            {t(
              "방금 끝낸 운동을 카드 이미지로 만들어 카카오톡·인스타그램에 바로 공유해요.",
              "Turn the workout you just finished into a card image and share it straight to KakaoTalk or Instagram.",
            )}
          </p>

          {/* Preview */}
          <div className="mt-4 rounded-2xl overflow-hidden border border-border-subtle bg-background aspect-[1080/1350] relative">
            {imgUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt={t("운동 완료 카드 미리보기", "Workout complete card preview")}
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
              {shared ? t("공유 완료", "Shared") : t("공유하기", "Share")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onDownload}
              disabled={rendering || !blob}
            >
              <Download size={15} />
              {t("이미지 저장", "Save image")}
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

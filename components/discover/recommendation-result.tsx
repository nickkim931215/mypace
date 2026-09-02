"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Play,
  BookmarkPlus,
  RotateCcw,
  FlaskConical,
  GraduationCap,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatClock, youtubeLearnUrl } from "@/lib/utils";
import type { Intensity, RecommendResult } from "@/lib/ai-recommend";
import { useT, useLocale } from "@/lib/i18n";

interface Props {
  result: RecommendResult;
  intensity: Intensity;
  onSaveAndStart: () => void;
  onSaveOnly: () => void;
  onRegenerate: () => void;
  onEasier: () => void;
  onHarder: () => void;
}

export function RecommendationResult({
  result,
  intensity,
  onSaveAndStart,
  onSaveOnly,
  onRegenerate,
  onEasier,
  onHarder,
}: Props) {
  const t = useT();
  const { locale } = useLocale();
  const totalSec = result.rounds.reduce((acc, r) => acc + r.durationSec, 0);
  const work = result.rounds.filter((r) => r.type === "work");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="card-premium p-6 sm:p-7 flex flex-col gap-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {result.source === "ai" ? (
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-accent/15 text-accent text-[11px] font-medium uppercase tracking-[0.16em]">
              <Sparkles size={11} />
              {t("AI 추천", "AI pick")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-surface-2 text-foreground-muted text-[11px] font-medium uppercase tracking-[0.16em]">
              <FlaskConical size={11} />
              {t("데모 모드", "Demo mode")}
            </span>
          )}
          <span className="text-[11px] text-foreground-dim">
            · {formatClock(totalSec)} ·{" "}
            {t(`${work.length}개 운동`, `${work.length} exercises`)}
          </span>
        </div>
        <button
          onClick={onRegenerate}
          className="h-8 w-8 rounded-full text-foreground-dim hover:text-foreground hover:bg-surface-2 flex items-center justify-center"
          aria-label={t("다시 생성", "Regenerate")}
          title={t("다시 생성", "Regenerate")}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div>
        <h2 className="font-display text-2xl sm:text-3xl tracking-[-0.02em] font-semibold">
          {result.name}
        </h2>
        <p className="mt-1.5 text-[13px] text-foreground-muted leading-relaxed">
          {result.description}
        </p>
      </div>

      {/* Visual round timeline */}
      <div className="flex flex-col gap-2.5">
        <div className="flex h-2 rounded-full overflow-hidden bg-surface-3">
          {result.rounds.map((r, idx) => {
            const w = (r.durationSec / totalSec) * 100;
            return (
              <div
                key={idx}
                style={{ width: `${w}%` }}
                className={cn(
                  r.type === "work"
                    ? "bg-accent"
                    : r.type === "rest"
                      ? "bg-rest"
                      : "bg-foreground-dim/60",
                )}
              />
            );
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-72 overflow-auto scroll-hide pr-1 -mr-1">
          {result.rounds.map((r, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl hover:bg-surface-2/50"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    r.type === "work"
                      ? "bg-accent"
                      : r.type === "rest"
                        ? "bg-rest"
                        : "bg-foreground-dim",
                  )}
                />
                <span className="text-[13px] text-foreground truncate">
                  {r.name}
                </span>
                {r.bpm ? (
                  <span className="tabular text-[10px] text-foreground-dim shrink-0">
                    {r.bpm}♪
                  </span>
                ) : null}
                {r.type === "work" ? (
                  <a
                    href={youtubeLearnUrl(r.name, locale)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 shrink-0 text-[10px] text-foreground-dim hover:text-accent transition-colors"
                    title={t(
                      `${r.name} 운동 영상 보기`,
                      `Watch ${r.name} demo video`,
                    )}
                  >
                    <GraduationCap size={11} />
                    {t("배우기", "Learn")}
                  </a>
                ) : null}
              </div>
              <span className="tabular text-[12px] text-foreground-muted shrink-0">
                {t(`${r.durationSec}초`, `${r.durationSec}s`)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty nudge — re-generates one step easier / harder. */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-[11px] uppercase tracking-[0.16em] text-foreground-dim shrink-0">
          {t("난이도 조정", "Adjust")}
        </span>
        <div className="flex-1 flex gap-2">
          <button
            onClick={onEasier}
            disabled={intensity === "easy"}
            className="flex-1 h-9 rounded-full bg-surface-2 text-foreground-muted hover:text-foreground hover:bg-surface-3 disabled:opacity-40 disabled:hover:bg-surface-2 text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <TrendingDown size={14} />
            {t("더 쉽게", "Easier")}
          </button>
          <button
            onClick={onHarder}
            disabled={intensity === "hard"}
            className="flex-1 h-9 rounded-full bg-surface-2 text-foreground-muted hover:text-foreground hover:bg-surface-3 disabled:opacity-40 disabled:hover:bg-surface-2 text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <TrendingUp size={14} />
            {t("더 어렵게", "Harder")}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="primary" size="md" onClick={onSaveAndStart} className="flex-1">
          <Play size={15} fill="currentColor" />
          {t("저장하고 바로 시작", "Save and start")}
        </Button>
        <Button variant="secondary" size="md" onClick={onSaveOnly}>
          <BookmarkPlus size={15} />
          {t("저장만", "Save only")}
        </Button>
      </div>
    </motion.div>
  );
}

export function RecommendationLoading() {
  const t = useT();
  return (
    <div className="card-premium p-7 flex flex-col items-center justify-center gap-4 min-h-[260px]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="h-12 w-12 rounded-full border-2 border-accent/30 border-t-accent"
      />
      <div className="text-center">
        <div className="text-[15px] font-medium text-foreground">
          {t("AI가 루틴을 만들고 있어요", "AI is building your routine")}
        </div>
        <div className="mt-1 text-[12px] text-foreground-muted">
          {t("몇 초만 기다려 주세요…", "Just a few seconds…")}
        </div>
      </div>
    </div>
  );
}

export function RecommendationError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const t = useT();
  return (
    <div className="card-premium p-7 flex flex-col items-center text-center gap-3">
      <div className="text-[15px] font-medium text-danger">
        {message}
      </div>
      <Button variant="secondary" size="md" onClick={onRetry}>
        <RotateCcw size={14} />
        {t("다시 시도", "Try again")}
      </Button>
    </div>
  );
}

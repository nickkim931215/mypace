"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Play,
  BookmarkPlus,
  RotateCcw,
  FlaskConical,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatClock, youtubeLearnUrl } from "@/lib/utils";
import type { RecommendResult } from "@/lib/ai-recommend";

interface Props {
  result: RecommendResult;
  onSaveAndStart: () => void;
  onSaveOnly: () => void;
  onRegenerate: () => void;
}

export function RecommendationResult({
  result,
  onSaveAndStart,
  onSaveOnly,
  onRegenerate,
}: Props) {
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
              AI 추천
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-surface-2 text-foreground-muted text-[11px] font-medium uppercase tracking-[0.16em]">
              <FlaskConical size={11} />
              데모 모드
            </span>
          )}
          <span className="text-[11px] text-foreground-dim">
            · {formatClock(totalSec)} · {work.length}개 운동
          </span>
        </div>
        <button
          onClick={onRegenerate}
          className="h-8 w-8 rounded-full text-foreground-dim hover:text-foreground hover:bg-surface-2 flex items-center justify-center"
          aria-label="다시 생성"
          title="다시 생성"
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
                    href={youtubeLearnUrl(r.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 shrink-0 text-[10px] text-foreground-dim hover:text-accent transition-colors"
                    title={`${r.name} 운동 영상 보기`}
                  >
                    <GraduationCap size={11} />
                    배우기
                  </a>
                ) : null}
              </div>
              <span className="tabular text-[12px] text-foreground-muted shrink-0">
                {r.durationSec}초
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <Button variant="primary" size="md" onClick={onSaveAndStart} className="flex-1">
          <Play size={15} fill="currentColor" />
          저장하고 바로 시작
        </Button>
        <Button variant="secondary" size="md" onClick={onSaveOnly}>
          <BookmarkPlus size={15} />
          저장만
        </Button>
      </div>
    </motion.div>
  );
}

export function RecommendationLoading() {
  return (
    <div className="card-premium p-7 flex flex-col items-center justify-center gap-4 min-h-[260px]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="h-12 w-12 rounded-full border-2 border-accent/30 border-t-accent"
      />
      <div className="text-center">
        <div className="text-[15px] font-medium text-foreground">
          AI가 루틴을 만들고 있어요
        </div>
        <div className="mt-1 text-[12px] text-foreground-muted">
          몇 초만 기다려 주세요…
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
  return (
    <div className="card-premium p-7 flex flex-col items-center text-center gap-3">
      <div className="text-[15px] font-medium text-danger">
        {message}
      </div>
      <Button variant="secondary" size="md" onClick={onRetry}>
        <RotateCcw size={14} />
        다시 시도
      </Button>
    </div>
  );
}

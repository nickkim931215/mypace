"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Flame,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Dumbbell,
  CalendarDays,
  CloudOff,
  Trophy,
  Share2,
  X,
  Trash2,
} from "lucide-react";
import { useTimerStore } from "@/store/timer-store";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { RecordShareModal } from "@/components/community/record-share-modal";
import { RecordImageModal } from "@/components/history/record-image-modal";
import { LevelCard } from "@/components/history/level-card";
import { LevelLadder } from "@/components/history/level-ladder";
import { formatDuration, cn } from "@/lib/utils";
import type { WorkoutCompletion } from "@/lib/types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// Local-time YYYY-MM-DD key (so a workout at 11pm counts for that local day).
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

// Consecutive days ending today (or yesterday, so the streak isn't shown as
// broken before today's workout is done).
function computeStreak(days: Set<string>): number {
  let streak = 0;
  const cursor = startOfDay(new Date());
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function HistoryView() {
  const completions = useTimerStore((s) => s.completions);
  const { configured, state } = useAuth();

  // Store is localStorage-backed — gate on mount to avoid hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [shareOpen, setShareOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const signedIn = state.status === "signedIn";

  const today = useMemo(() => startOfDay(new Date()), []);
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));

  const { countByDay, sorted } = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of completions) {
      const k = dateKey(new Date(c.completedAt));
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    const s = [...completions].sort((a, b) => b.completedAt - a.completedAt);
    return { countByDay: map, sorted: s };
  }, [completions]);

  const daysSet = useMemo(() => new Set(countByDay.keys()), [countByDay]);
  const streak = useMemo(
    () => (mounted ? computeStreak(daysSet) : 0),
    [daysSet, mounted],
  );

  // Counts for the visible month + the running week.
  const monthCount = useMemo(() => {
    let n = 0;
    for (const c of completions) {
      const d = new Date(c.completedAt);
      if (d.getFullYear() === cursor.year && d.getMonth() === cursor.month) n++;
    }
    return n;
  }, [completions, cursor]);

  const weekCount = useMemo(() => {
    if (!mounted) return 0;
    const start = startOfDay(new Date());
    start.setDate(start.getDate() - start.getDay()); // back to Sunday
    const startMs = start.getTime();
    return completions.filter((c) => c.completedAt >= startMs).length;
  }, [completions, mounted]);

  // Build the calendar grid for the cursor month.
  const grid = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const lead = first.getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells: ({ day: number; key: string } | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        day,
        key: dateKey(new Date(cursor.year, cursor.month, day)),
      });
    }
    return cells;
  }, [cursor]);

  const todayKey = dateKey(today);
  const monthLabel = `${cursor.year}년 ${cursor.month + 1}월`;
  const isCurrentMonth =
    cursor.year === today.getFullYear() && cursor.month === today.getMonth();

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  if (!mounted) {
    return (
      <div className="card-premium h-80 animate-pulse" aria-hidden />
    );
  }

  const empty = completions.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {configured && state.status === "signedOut" && (
        <div className="card-premium px-5 py-3.5 flex items-center gap-2.5 text-[13px] text-foreground-muted">
          <CloudOff size={15} className="text-accent shrink-0" />
          로그인하면 기록이 기기 간에 동기화돼요.
        </div>
      )}

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-3">
        <Stat
          icon={<Flame size={16} className="text-accent" />}
          value={`${streak}일`}
          label="연속 기록"
          highlight={streak > 0}
        />
        <Stat
          icon={<CalendarDays size={16} className="text-accent" />}
          value={`${weekCount}회`}
          label="이번 주"
        />
        <Stat
          icon={<Dumbbell size={16} className="text-accent" />}
          value={`${completions.length}회`}
          label="누적 완료"
        />
      </div>

      {/* Level / 칭호 */}
      <LevelCard count={completions.length} />

      {!empty && (
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={() => setImageOpen(true)}
            className="self-stretch sm:self-auto"
          >
            <Share2 size={15} />
            기록 이미지로 공유
          </Button>
          {signedIn && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShareOpen(true)}
              className="self-stretch sm:self-auto"
            >
              <Trophy size={15} />
              커뮤니티에 자랑하기
            </Button>
          )}
        </div>
      )}

      {/* Calendar */}
      <div className="card-premium p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="이전 달"
            className="h-9 w-9 rounded-full hover:bg-surface-2 flex items-center justify-center text-foreground-muted transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="font-display text-lg font-semibold tracking-tight">
              {monthLabel}
            </p>
            <p className="text-[12px] text-foreground-dim">
              이 달 {monthCount}회 운동
            </p>
          </div>
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

        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={cn(
                "text-center text-[11px] font-medium",
                i === 0 ? "text-danger/70" : "text-foreground-dim",
              )}
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell, idx) => {
            if (!cell) return <div key={`b${idx}`} />;
            const count = countByDay.get(cell.key) ?? 0;
            const done = count > 0;
            const isToday = cell.key === todayKey;
            const className = cn(
              "aspect-square rounded-xl flex flex-col items-center justify-center text-[13px] relative transition-colors",
              done
                ? "bg-accent/15 text-accent font-semibold"
                : "text-foreground-muted",
              isToday && "ring-1 ring-inset ring-accent/60",
            );
            if (!done) {
              return (
                <div key={cell.key} className={className}>
                  {cell.day}
                </div>
              );
            }
            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDay(cell.key)}
                className={cn(className, "hover:bg-accent/25 cursor-pointer")}
                title={`${count}회 완료 · 눌러서 보기`}
              >
                {cell.day}
                {/* One dot per workout that day (capped at 4 to fit the cell;
                    the exact count is in the title + day-detail sheet). */}
                <span className="absolute inset-x-0 bottom-1.5 flex items-center justify-center gap-0.5">
                  {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                    <span
                      key={i}
                      className="h-1 w-1 rounded-full bg-accent"
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Level ladder overview */}
      <LevelLadder count={completions.length} />

      {/* Recent list */}
      <div>
        {empty ? (
          <>
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-foreground-dim mb-3">
              최근 완료
            </h2>
            <div className="card-premium px-8 py-14 flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-accent/15 text-accent flex items-center justify-center">
                <Flame size={24} />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">
                첫 기록을 남겨보세요
              </h3>
              <p className="mt-2 text-[13px] text-foreground-muted max-w-xs leading-relaxed">
                루틴을 끝까지 완료하면 여기에 날짜별로 쌓여요. 연속 기록을
                이어가 보세요.
              </p>
              <Link href="/timer" className="mt-6">
                <Button variant="primary" size="md">
                  운동 시작하기
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setRecentOpen((o) => !o)}
              aria-expanded={recentOpen}
              className="card-premium w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-surface-2 transition-colors"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="h-9 w-9 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <Dumbbell size={15} />
                </span>
                <span className="text-[14px] font-medium">
                  최근 완료 운동 리스트
                </span>
              </span>
              <span className="flex items-center gap-2 text-foreground-dim shrink-0">
                <span className="text-[12px] tabular-nums">
                  {completions.length}회
                </span>
                <ChevronDown
                  size={18}
                  className={cn(
                    "transition-transform",
                    recentOpen && "rotate-180",
                  )}
                />
              </span>
            </button>
            {recentOpen && (
              <ul className="flex flex-col gap-2 mt-2.5">
                {sorted.map((c) => (
                  <RecentRow key={c.id} completion={c} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {shareOpen && <RecordShareModal onClose={() => setShareOpen(false)} />}
      {imageOpen && <RecordImageModal onClose={() => setImageOpen(false)} />}
      {selectedDay && (
        <DayRecordsModal
          dayKey={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}

// Day-detail sheet: lists every completion logged on one day, each removable
// (with a per-row confirm) — for clearing an accidental run left to auto-finish.
function DayRecordsModal({
  dayKey,
  onClose,
}: {
  dayKey: string;
  onClose: () => void;
}) {
  const completions = useTimerStore((s) => s.completions);
  const deleteCompletion = useTimerStore((s) => s.deleteCompletion);

  const rows = useMemo(
    () =>
      completions
        .filter((c) => dateKey(new Date(c.completedAt)) === dayKey)
        .sort((a, b) => b.completedAt - a.completedAt),
    [completions, dayKey],
  );

  // Auto-close once the day has no records left.
  useEffect(() => {
    if (rows.length === 0) onClose();
  }, [rows.length, onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const [y, m, d] = dayKey.split("-").map(Number);
  const heading = new Date(y, m - 1, d).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full sm:max-w-md max-h-[88dvh] bg-surface-1 border border-border-subtle sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl"
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

        <div className="overflow-y-auto overscroll-contain px-5 sm:px-6 pt-7 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
            History
          </span>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
            {heading}
          </h2>
          <p className="mt-1 text-[13px] text-foreground-muted">
            {rows.length}회 완료 · 실수로 기록된 운동은 삭제할 수 있어요.
          </p>

          <ul className="mt-5 flex flex-col gap-2">
            {rows.map((c) => (
              <DayRow
                key={c.id}
                completion={c}
                onDelete={() => deleteCompletion(c.id)}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function DayRow({
  completion,
  onDelete,
}: {
  completion: WorkoutCompletion;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const timeLabel = new Date(completion.completedAt).toLocaleTimeString(
    "ko-KR",
    { hour: "2-digit", minute: "2-digit" },
  );

  return (
    <li className="card-premium px-4 py-3 flex items-center gap-3">
      <span className="h-9 w-9 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
        <Dumbbell size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium truncate">
          {completion.routineName}
        </p>
        <p className="text-[12px] text-foreground-dim tabular-nums">
          {timeLabel} · {formatDuration(completion.durationSec)}
        </p>
      </div>

      {confirming ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onDelete}
            className="h-8 px-3 rounded-full text-[12px] font-medium bg-danger text-white hover:brightness-110 transition-all"
          >
            삭제
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-8 px-3 rounded-full text-[12px] font-medium bg-surface-2 text-foreground-muted hover:bg-surface-3 transition-colors"
          >
            취소
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label="이 기록 삭제"
          className="h-8 w-8 rounded-full text-foreground-dim hover:text-danger hover:bg-danger/10 flex items-center justify-center transition-colors shrink-0"
        >
          <Trash2 size={15} />
        </button>
      )}
    </li>
  );
}

function Stat({
  icon,
  value,
  label,
  highlight,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "card-premium px-3 py-4 flex flex-col items-center gap-1 text-center",
        highlight && "border-accent/40 bg-accent/[0.06]",
      )}
    >
      {icon}
      <span className="font-display text-xl font-semibold tracking-tight tabular-nums">
        {value}
      </span>
      <span className="text-[11px] text-foreground-dim">{label}</span>
    </div>
  );
}

function RecentRow({ completion }: { completion: WorkoutCompletion }) {
  const d = new Date(completion.completedAt);
  const dateLabel = d.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const timeLabel = d.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <li className="card-premium px-4 py-3 flex items-center gap-3">
      <span className="h-9 w-9 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
        <Dumbbell size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium truncate">
          {completion.routineName}
        </p>
        <p className="text-[12px] text-foreground-dim">
          {dateLabel} · {timeLabel}
        </p>
      </div>
      <span className="text-[12px] text-foreground-muted tabular-nums shrink-0">
        {formatDuration(completion.durationSec)}
      </span>
    </li>
  );
}

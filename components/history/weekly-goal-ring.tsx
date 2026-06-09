"use client";

import { Minus, Plus, Check, Target } from "lucide-react";
import {
  useTimerStore,
  WEEKLY_GOAL_MIN,
  WEEKLY_GOAL_MAX,
} from "@/store/timer-store";
import { cn } from "@/lib/utils";

// Weekly workout-goal progress ring shown at the top of /history.
// `weekCount` is computed by the parent (after mount) to avoid hydration drift.
export function WeeklyGoalRing({ weekCount }: { weekCount: number }) {
  const goal = useTimerStore((s) => s.weeklyGoal);
  const setGoal = useTimerStore((s) => s.setWeeklyGoal);

  const safeGoal = Math.max(1, goal);
  const progress = Math.min(weekCount / safeGoal, 1);
  const achieved = weekCount >= safeGoal;
  const remaining = Math.max(safeGoal - weekCount, 0);

  // Ring geometry.
  const size = 132;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  return (
    <div className="card-premium p-5 sm:p-6 flex items-center gap-5 sm:gap-7">
      {/* Ring */}
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            className="stroke-surface-3"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className={cn(
              "transition-[stroke-dashoffset] duration-700 ease-out",
              achieved ? "stroke-success" : "stroke-accent",
            )}
            style={
              achieved
                ? { filter: "drop-shadow(0 0 6px rgba(34,197,94,0.5))" }
                : { filter: "drop-shadow(0 0 5px var(--accent-glow))" }
            }
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {achieved ? (
            <span className="h-9 w-9 rounded-full bg-success/15 text-success flex items-center justify-center mb-0.5">
              <Check size={20} strokeWidth={2.5} />
            </span>
          ) : null}
          <span className="font-display text-2xl font-bold tracking-tight tabular-nums leading-none">
            {weekCount}
            <span className="text-foreground-dim text-base font-semibold">
              /{goal}
            </span>
          </span>
          <span className="text-[11px] text-foreground-dim mt-1">회</span>
        </div>
      </div>

      {/* Copy + stepper */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-accent">
          <Target size={14} />
          <span className="text-[11px] uppercase tracking-[0.18em] font-medium">
            주간 목표
          </span>
        </div>
        <p className="mt-2 text-[15px] font-medium leading-snug">
          {achieved ? (
            <>이번 주 목표 달성! 🎉</>
          ) : (
            <>
              목표까지{" "}
              <span className="text-accent font-semibold tabular-nums">
                {remaining}회
              </span>{" "}
              남았어요
            </>
          )}
        </p>
        <p className="mt-1 text-[12px] text-foreground-dim">
          {achieved
            ? "꾸준함이 진짜 실력이에요."
            : "이번 주에 운동을 완료하면 채워져요."}
        </p>

        {/* Goal stepper */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[11px] text-foreground-dim">목표</span>
          <div className="flex items-center gap-2">
            <StepBtn
              ariaLabel="목표 줄이기"
              disabled={goal <= WEEKLY_GOAL_MIN}
              onClick={() => setGoal(goal - 1)}
            >
              <Minus size={15} />
            </StepBtn>
            <span className="w-14 text-center font-display text-base font-semibold tabular-nums">
              주 {goal}회
            </span>
            <StepBtn
              ariaLabel="목표 늘리기"
              disabled={goal >= WEEKLY_GOAL_MAX}
              onClick={() => setGoal(goal + 1)}
            >
              <Plus size={15} />
            </StepBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepBtn({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="h-8 w-8 rounded-full bg-surface-2 hover:bg-surface-3 disabled:opacity-30 disabled:hover:bg-surface-2 flex items-center justify-center text-foreground-muted transition-colors"
    >
      {children}
    </button>
  );
}

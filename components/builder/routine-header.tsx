"use client";

import Link from "next/link";
import { ChevronDown, Plus, Copy, Trash2, Play, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimerStore } from "@/store/timer-store";
import { formatClock } from "@/lib/utils";
import type { Routine } from "@/lib/types";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  routine: Routine;
}

export function RoutineHeader({ routine }: Props) {
  const routines = useTimerStore((s) => s.routines);
  const selectRoutine = useTimerStore((s) => s.selectRoutine);
  const createRoutine = useTimerStore((s) => s.createRoutine);
  const duplicateRoutine = useTimerStore((s) => s.duplicateRoutine);
  const deleteRoutine = useTimerStore((s) => s.deleteRoutine);
  const renameRoutine = useTimerStore((s) => s.renameRoutine);
  const setRepeat = useTimerStore((s) => s.setRepeat);

  const [open, setOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const work = routine.rounds.filter((r) => r.type === "work").length;
  const rest = routine.rounds.filter((r) => r.type === "rest").length;

  // Routines auto-persist (localStorage + cloud sync), but an explicit "저장"
  // gives clear confirmation and bumps updatedAt so a sync push is triggered.
  const handleSave = () => {
    renameRoutine(routine.id, routine.name.trim() || "새 루틴");
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Routine switcher */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-surface-1 border border-border-subtle hover:border-border-strong transition-colors"
          >
            <span className="text-[13px] text-foreground-muted">내 루틴</span>
            <span className="text-[13px] font-medium text-foreground truncate max-w-[180px]">
              {routine.name}
            </span>
            <ChevronDown
              size={14}
              className={cn(
                "text-foreground-dim transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
          {open && (
            <div className="absolute z-30 top-full mt-2 w-72 card-premium p-2 shadow-2xl">
              <div className="max-h-72 overflow-auto scroll-hide">
                {routines.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      selectRoutine(r.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl hover:bg-surface-2 flex items-center justify-between gap-3",
                      r.id === routine.id && "bg-surface-2",
                    )}
                  >
                    <span className="truncate text-[13px] text-foreground">
                      {r.name}
                    </span>
                    <span className="tabular text-[11px] text-foreground-dim">
                      {formatClock(r.totalDurationSec * r.repeat)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="border-t border-border-subtle mt-2 pt-2 flex gap-1">
                <button
                  onClick={() => {
                    createRoutine();
                    setOpen(false);
                  }}
                  className="flex-1 text-[12px] text-foreground-muted hover:text-foreground hover:bg-surface-2 rounded-lg px-2 py-2 inline-flex items-center justify-center gap-1.5"
                >
                  <Plus size={13} /> 새 루틴
                </button>
                <button
                  onClick={() => {
                    duplicateRoutine(routine.id);
                    setOpen(false);
                  }}
                  className="flex-1 text-[12px] text-foreground-muted hover:text-foreground hover:bg-surface-2 rounded-lg px-2 py-2 inline-flex items-center justify-center gap-1.5"
                >
                  <Copy size={13} /> 복제
                </button>
                {routines.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(`"${routine.name}"을(를) 삭제할까요?`)) {
                        deleteRoutine(routine.id);
                        setOpen(false);
                      }
                    }}
                    className="text-[12px] text-foreground-muted hover:text-danger hover:bg-danger/10 rounded-lg px-2 py-2 inline-flex items-center justify-center"
                    aria-label="삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={justSaved ? "primary" : "secondary"}
            size="md"
            onClick={handleSave}
          >
            {justSaved ? (
              <>
                <Check size={15} /> 저장됨
              </>
            ) : (
              "저장"
            )}
          </Button>
          <Link href={`/timer/run`}>
            <Button variant="primary" size="md">
              <Play size={15} fill="currentColor" />
              시작
            </Button>
          </Link>
        </div>
      </div>

      {/* Name + meta */}
      <div className="flex flex-col gap-3">
        <input
          value={routine.name}
          onChange={(e) => renameRoutine(routine.id, e.target.value)}
          className="bg-transparent font-display text-[32px] sm:text-[40px] tracking-[-0.03em] font-semibold text-foreground focus:outline-none placeholder:text-foreground-dim"
          placeholder="루틴 이름"
        />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-foreground-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-foreground-dim">총 시간</span>
            <span className="tabular text-foreground font-medium">
              {formatClock(routine.totalDurationSec * routine.repeat)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-foreground-dim">라운드</span>
            <span className="tabular text-foreground font-medium">
              {routine.rounds.length}개
            </span>
            <span className="text-foreground-dim">
              ({work} 운동 · {rest} 휴식)
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="text-foreground-dim">반복</span>
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => setRepeat(routine.id, routine.repeat - 1)}
                className="h-6 w-6 rounded-full bg-surface-2 hover:bg-surface-3 text-foreground-muted text-xs"
                aria-label="반복 감소"
              >
                −
              </button>
              <span className="tabular text-foreground font-medium w-5 text-center">
                {routine.repeat}
              </span>
              <button
                onClick={() => setRepeat(routine.id, routine.repeat + 1)}
                className="h-6 w-6 rounded-full bg-surface-2 hover:bg-surface-3 text-foreground-muted text-xs"
                aria-label="반복 증가"
              >
                +
              </button>
            </div>
          </span>
          {routine.rating ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="text-foreground-dim">평가</span>
              <span className="inline-flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={13}
                    className={cn(
                      n <= routine.rating!
                        ? "text-accent fill-accent"
                        : "text-surface-3 fill-surface-3",
                    )}
                  />
                ))}
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

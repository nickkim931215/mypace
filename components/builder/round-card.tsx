"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Copy,
  GripVertical,
  Minus,
  Plus,
  Trash2,
  Dumbbell,
  Coffee,
  Hourglass,
} from "lucide-react";
import type { Round, RoundType } from "@/lib/types";
import { cn } from "@/lib/utils";

const typeMeta: Record<
  RoundType,
  { label: string; color: string; bg: string; ring: string; icon: typeof Dumbbell }
> = {
  work: {
    label: "운동",
    color: "text-work",
    bg: "bg-work/10",
    ring: "ring-work/30",
    icon: Dumbbell,
  },
  rest: {
    label: "휴식",
    color: "text-rest",
    bg: "bg-rest/10",
    ring: "ring-rest/30",
    icon: Coffee,
  },
  prepare: {
    label: "준비",
    color: "text-foreground-muted",
    bg: "bg-surface-3",
    ring: "ring-border-strong",
    icon: Hourglass,
  },
};

interface Props {
  round: Round;
  onChange: (patch: Partial<Round>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export function RoundCard({ round, onChange, onDuplicate, onRemove }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: round.id });

  const meta = typeMeta[round.type];
  const Icon = meta.icon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "card-premium p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4",
        "transition-shadow",
        isDragging && "ring-1 ring-accent/40 shadow-2xl z-10",
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="hidden sm:flex h-9 w-7 -ml-1 items-center justify-center text-foreground-dim hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
        aria-label="순서 변경"
      >
        <GripVertical size={18} />
      </button>

      {/* Type badge */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className={cn(
            "h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center ring-1",
            meta.bg,
            meta.color,
            meta.ring,
          )}
        >
          <Icon size={18} />
        </div>
        <select
          value={round.type}
          onChange={(e) =>
            onChange({ type: e.target.value as RoundType })
          }
          className="sm:hidden h-9 px-3 rounded-full bg-surface-2 border border-border-subtle text-xs text-foreground"
        >
          <option value="work">운동</option>
          <option value="rest">휴식</option>
          <option value="prepare">준비</option>
        </select>
      </div>

      {/* Name + type (desktop) */}
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <input
          value={round.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="flex-1 min-w-0 bg-transparent text-[15px] font-medium text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-accent/40 rounded-md px-1 -mx-1"
          placeholder="운동 이름"
        />
        <select
          value={round.type}
          onChange={(e) =>
            onChange({ type: e.target.value as RoundType })
          }
          className="hidden sm:block h-8 px-3 rounded-full bg-surface-2 border border-border-subtle text-[12px] text-foreground-muted"
        >
          <option value="work">운동</option>
          <option value="rest">휴식</option>
          <option value="prepare">준비</option>
        </select>
      </div>

      {/* Duration stepper */}
      <div className="flex items-center gap-2">
        <button
          onClick={() =>
            onChange({
              durationSec: Math.max(5, round.durationSec - 5),
            })
          }
          className="h-9 w-9 rounded-full bg-surface-2 hover:bg-surface-3 text-foreground-muted flex items-center justify-center transition-colors"
          aria-label="시간 감소"
        >
          <Minus size={14} />
        </button>
        <div className="tabular text-[15px] font-semibold text-foreground min-w-[64px] text-center">
          {round.durationSec}
          <span className="text-foreground-dim text-[12px] ml-1">초</span>
        </div>
        <button
          onClick={() =>
            onChange({
              durationSec: Math.min(3600, round.durationSec + 5),
            })
          }
          className="h-9 w-9 rounded-full bg-surface-2 hover:bg-surface-3 text-foreground-muted flex items-center justify-center transition-colors"
          aria-label="시간 증가"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* BPM for work rounds */}
      {round.type === "work" && (
        <div className="flex items-center gap-2 pl-3 sm:border-l sm:border-border-subtle">
          <span className="text-[11px] uppercase tracking-[0.16em] text-foreground-dim">
            BPM
          </span>
          <input
            type="number"
            min={40}
            max={240}
            value={round.bpm ?? ""}
            onChange={(e) =>
              onChange({
                bpm: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="—"
            className="tabular w-14 h-9 bg-surface-2 border border-border-subtle rounded-full px-3 text-[13px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:border-accent/40 text-center"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onDuplicate}
          className="h-9 w-9 rounded-full text-foreground-dim hover:text-foreground hover:bg-surface-2 flex items-center justify-center transition-colors"
          aria-label="복제"
        >
          <Copy size={15} />
        </button>
        <button
          onClick={onRemove}
          className="h-9 w-9 rounded-full text-foreground-dim hover:text-danger hover:bg-danger/10 flex items-center justify-center transition-colors"
          aria-label="삭제"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

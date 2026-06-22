"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Copy,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Minus,
  Plus,
  Trash2,
  Dumbbell,
  Coffee,
  Hourglass,
} from "lucide-react";
import type { Round, RoundType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT, type TranslateFn } from "@/lib/i18n";

function typeMetaMap(
  t: TranslateFn,
): Record<
  RoundType,
  { label: string; color: string; bg: string; ring: string; icon: typeof Dumbbell }
> {
  return {
    work: {
      label: t("운동", "Work"),
      color: "text-work",
      bg: "bg-work/10",
      ring: "ring-work/30",
      icon: Dumbbell,
    },
    rest: {
      label: t("휴식", "Rest"),
      color: "text-rest",
      bg: "bg-rest/10",
      ring: "ring-rest/30",
      icon: Coffee,
    },
    prepare: {
      label: t("준비", "Prepare"),
      color: "text-foreground-muted",
      bg: "bg-surface-3",
      ring: "ring-border-strong",
      icon: Hourglass,
    },
  };
}

// Combine a minutes + seconds pair into a clamped total. Minutes 0–60, seconds
// 0–59, total kept within 5s–60min. NaN (empty field) counts as 0.
function clampDuration(mins: number, secs: number): number {
  const m = Math.min(60, Math.max(0, Math.floor(mins) || 0));
  const s = Math.min(59, Math.max(0, Math.floor(secs) || 0));
  return Math.min(3600, Math.max(5, m * 60 + s));
}

// Clamp a raw total (used by the +/- steppers, which roll seconds over into
// minutes — e.g. 55s +5 → 1:00, 1:00 -5 → 0:55).
function clampSec(total: number): number {
  return Math.min(3600, Math.max(5, total));
}

// One unit's control: [−] [typed value] [+] with a unit label. Buttons are
// always visible (mobile has no number-input spinners).
function UnitStepper({
  unit,
  unitEn,
  value,
  onDec,
  onInc,
  onType,
  max,
  t,
}: {
  unit: string;
  unitEn: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
  onType: (v: number) => void;
  max: number;
  t: TranslateFn;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onDec}
        aria-label={t(`${unit} 감소`, `Decrease ${unitEn}`)}
        className="h-8 w-8 shrink-0 rounded-full bg-surface-2 hover:bg-surface-3 text-foreground-muted flex items-center justify-center transition-colors"
      >
        <Minus size={13} />
      </button>
      <input
        type="number"
        min={0}
        max={max}
        inputMode="numeric"
        value={value}
        onChange={(e) => onType(Number(e.target.value))}
        onFocus={(e) => e.target.select()}
        aria-label={t(unit, unitEn)}
        className="tabular w-10 h-9 bg-surface-2 border border-border-subtle rounded-full px-1 text-[14px] font-semibold text-foreground text-center focus:outline-none focus:border-accent/40"
      />
      <span className="text-foreground-dim text-[12px] w-3">{t(unit, unitEn)}</span>
      <button
        type="button"
        onClick={onInc}
        aria-label={t(`${unit} 증가`, `Increase ${unitEn}`)}
        className="h-8 w-8 shrink-0 rounded-full bg-surface-2 hover:bg-surface-3 text-foreground-muted flex items-center justify-center transition-colors"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

interface Props {
  round: Round;
  index: number;
  total: number;
  onChange: (patch: Partial<Round>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function RoundCard({
  round,
  index,
  total,
  onChange,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  const t = useT();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: round.id });

  const meta = typeMetaMap(t)[round.type];
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
        "card-premium p-3 sm:p-5 flex flex-wrap sm:flex-nowrap items-center gap-x-2 gap-y-2.5 sm:gap-4",
        "transition-shadow",
        isDragging && "ring-1 ring-accent/40 shadow-2xl z-10",
      )}
    >
      {/* Drag handle (desktop only) */}
      <button
        {...attributes}
        {...listeners}
        className="hidden sm:flex h-9 w-7 -ml-1 items-center justify-center text-foreground-dim hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
        aria-label={t("순서 변경", "Reorder")}
      >
        <GripVertical size={18} />
      </button>

      {/* Reorder buttons (mobile only — no drag handle on touch) */}
      <div className="sm:hidden flex flex-col shrink-0 -my-1 -ml-1">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          aria-label={t("위로 이동", "Move up")}
          className="h-[18px] w-6 flex items-center justify-center text-foreground-dim hover:text-foreground disabled:opacity-25 transition-colors"
        >
          <ChevronUp size={16} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          aria-label={t("아래로 이동", "Move down")}
          className="h-[18px] w-6 flex items-center justify-center text-foreground-dim hover:text-foreground disabled:opacity-25 transition-colors"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Type icon */}
      <div
        className={cn(
          "h-9 w-9 sm:h-11 sm:w-11 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center ring-1",
          meta.bg,
          meta.color,
          meta.ring,
        )}
      >
        <Icon size={17} />
      </div>

      {/* Name + type (desktop select sits inline; mobile select drops to row 2) */}
      <div className="flex-1 min-w-[120px] flex items-center gap-2 sm:gap-3">
        <input
          value={round.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="flex-1 min-w-0 bg-transparent text-[15px] font-medium text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-accent/40 rounded-md px-1 -mx-1"
          placeholder={t("운동 이름", "Exercise name")}
        />
        <select
          value={round.type}
          onChange={(e) => onChange({ type: e.target.value as RoundType })}
          className="hidden sm:block h-8 px-3 rounded-full bg-surface-2 border border-border-subtle text-[12px] text-foreground-muted"
        >
          <option value="work">{t("운동", "Work")}</option>
          <option value="rest">{t("휴식", "Rest")}</option>
          <option value="prepare">{t("준비", "Prepare")}</option>
        </select>
      </div>

      {/* Type select (mobile only) */}
      <select
        value={round.type}
        onChange={(e) => onChange({ type: e.target.value as RoundType })}
        className="sm:hidden h-9 px-2.5 rounded-full bg-surface-2 border border-border-subtle text-xs text-foreground"
      >
        <option value="work">{t("운동", "Work")}</option>
        <option value="rest">{t("휴식", "Rest")}</option>
        <option value="prepare">{t("준비", "Prepare")}</option>
      </select>

      {/* Duration — minute & second steppers (rolls over at 60s) */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <UnitStepper
          unit="분"
          unitEn="min"
          value={Math.floor(round.durationSec / 60)}
          onDec={() => onChange({ durationSec: clampSec(round.durationSec - 60) })}
          onInc={() => onChange({ durationSec: clampSec(round.durationSec + 60) })}
          onType={(m) =>
            onChange({ durationSec: clampDuration(m, round.durationSec % 60) })
          }
          max={60}
          t={t}
        />
        <UnitStepper
          unit="초"
          unitEn="sec"
          value={round.durationSec % 60}
          onDec={() => onChange({ durationSec: clampSec(round.durationSec - 5) })}
          onInc={() => onChange({ durationSec: clampSec(round.durationSec + 5) })}
          onType={(s) =>
            onChange({
              durationSec: clampDuration(Math.floor(round.durationSec / 60), s),
            })
          }
          max={59}
          t={t}
        />
      </div>

      {/* BPM for work rounds */}
      {round.type === "work" && (
        <div className="flex items-center gap-2 sm:pl-3 sm:border-l sm:border-border-subtle">
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
      <div className="flex items-center gap-1 ml-auto sm:ml-0">
        <button
          onClick={onDuplicate}
          className="h-9 w-9 rounded-full text-foreground-dim hover:text-foreground hover:bg-surface-2 flex items-center justify-center transition-colors"
          aria-label={t("복제", "Duplicate")}
        >
          <Copy size={15} />
        </button>
        <button
          onClick={onRemove}
          className="h-9 w-9 rounded-full text-foreground-dim hover:text-danger hover:bg-danger/10 flex items-center justify-center transition-colors"
          aria-label={t("삭제", "Delete")}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

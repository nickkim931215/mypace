import { Flame, CalendarDays, Dumbbell } from "lucide-react";
import { monthGrid, WEEKDAYS } from "@/lib/history";
import type { RecordSnapshot } from "@/lib/types";
import { cn } from "@/lib/utils";

// Renders a frozen workout-history snapshot: streak/week/total stats + the
// month's calendar with completed days highlighted. Shared by the feed card,
// the detail modal, and the share-modal preview.
export function RecordCalendarCard({
  record,
  className,
}: {
  record: RecordSnapshot;
  className?: string;
}) {
  const cells = monthGrid(record.year, record.month);
  const doneDays = new Set(record.days);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="grid grid-cols-3 gap-2">
        <MiniStat
          icon={<Flame size={14} className="text-accent" />}
          value={`${record.streak}일`}
          label="연속"
          highlight={record.streak > 0}
        />
        <MiniStat
          icon={<CalendarDays size={14} className="text-accent" />}
          value={`${record.weekCount}회`}
          label="이번 주"
        />
        <MiniStat
          icon={<Dumbbell size={14} className="text-accent" />}
          value={`${record.totalCount}회`}
          label="누적"
        />
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-2/50 p-4">
        <div className="flex items-baseline justify-between mb-3">
          <p className="font-display text-[15px] font-semibold tracking-tight">
            {record.monthLabel}
          </p>
          <p className="text-[11px] text-foreground-dim">
            이 달 {record.monthCount}회
          </p>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={cn(
                "text-center text-[10px] font-medium",
                i === 0 ? "text-danger/70" : "text-foreground-dim",
              )}
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, idx) => {
            if (!cell) return <div key={`b${idx}`} />;
            const done = doneDays.has(cell.day);
            return (
              <div
                key={cell.key}
                className={cn(
                  "aspect-square rounded-lg flex items-center justify-center text-[11px] relative",
                  done
                    ? "bg-accent/20 text-accent font-semibold"
                    : "text-foreground-dim",
                )}
              >
                {cell.day}
                {done && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniStat({
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
        "rounded-xl border border-border-subtle bg-surface-2/50 px-2 py-2.5 flex flex-col items-center gap-0.5 text-center",
        highlight && "border-accent/40 bg-accent/[0.07]",
      )}
    >
      {icon}
      <span className="font-display text-[15px] font-semibold tracking-tight tabular-nums">
        {value}
      </span>
      <span className="text-[10px] text-foreground-dim">{label}</span>
    </div>
  );
}

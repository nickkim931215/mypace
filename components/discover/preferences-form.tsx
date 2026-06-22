"use client";

import { cn } from "@/lib/utils";
import type { Equipment, Intensity } from "@/lib/ai-recommend";
import { EQUIPMENT_LABEL, INTENSITY_LABEL } from "@/lib/ai-recommend";
import { Flame, Snowflake, Zap, Dumbbell, Square, Layers } from "lucide-react";
import { useT } from "@/lib/i18n";

const INTENSITY_LABEL_EN: Record<Intensity, string> = {
  easy: "Beginner",
  medium: "Intermediate",
  hard: "Advanced",
};

const EQUIPMENT_LABEL_EN: Record<Equipment, string> = {
  bodyweight: "Bodyweight",
  dumbbell: "Dumbbell",
  mat: "Mat",
};

interface Props {
  minutes: number;
  onMinutesChange: (m: number) => void;
  intensity: Intensity;
  onIntensityChange: (i: Intensity) => void;
  equipment: Equipment[];
  onEquipmentChange: (e: Equipment[]) => void;
}

const DURATIONS = [5, 10, 15, 20, 30];

const INTENSITY_ICONS: Record<Intensity, typeof Flame> = {
  easy: Snowflake,
  medium: Zap,
  hard: Flame,
};

const EQUIPMENT_ICONS: Record<Equipment, typeof Dumbbell> = {
  bodyweight: Square,
  dumbbell: Dumbbell,
  mat: Layers,
};

export function PreferencesForm({
  minutes,
  onMinutesChange,
  intensity,
  onIntensityChange,
  equipment,
  onEquipmentChange,
}: Props) {
  const t = useT();
  const toggleEquipment = (e: Equipment) => {
    if (equipment.includes(e)) {
      onEquipmentChange(equipment.filter((x) => x !== e));
    } else {
      onEquipmentChange([...equipment, e]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Section label={t("시간", "Time")}>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((m) => (
            <button
              key={m}
              onClick={() => onMinutesChange(m)}
              className={cn(
                "h-11 px-5 rounded-full text-[14px] font-medium transition-colors",
                minutes === m
                  ? "bg-accent text-black"
                  : "bg-surface-1 border border-border-subtle text-foreground-muted hover:text-foreground",
              )}
            >
              {t(`${m}분`, `${m} min`)}
            </button>
          ))}
        </div>
      </Section>

      <Section label={t("강도", "Intensity")}>
        <div className="grid grid-cols-3 gap-2">
          {(["easy", "medium", "hard"] as Intensity[]).map((i) => {
            const Icon = INTENSITY_ICONS[i];
            const active = intensity === i;
            return (
              <button
                key={i}
                onClick={() => onIntensityChange(i)}
                className={cn(
                  "h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all",
                  active
                    ? "bg-accent text-black"
                    : "bg-surface-1 border border-border-subtle text-foreground-muted hover:text-foreground hover:border-border-strong",
                )}
              >
                <Icon size={16} />
                <span className="text-[12px] font-medium">
                  {t(INTENSITY_LABEL[i], INTENSITY_LABEL_EN[i])}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        label={t("보유 기구", "Equipment")}
        hint={t("여러 개 선택 가능", "Select multiple")}
      >
        <div className="grid grid-cols-3 gap-2">
          {(["bodyweight", "dumbbell", "mat"] as Equipment[]).map((e) => {
            const Icon = EQUIPMENT_ICONS[e];
            const active = equipment.includes(e);
            return (
              <button
                key={e}
                onClick={() => toggleEquipment(e)}
                className={cn(
                  "h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all",
                  active
                    ? "bg-accent/15 ring-1 ring-accent/40 text-accent"
                    : "bg-surface-1 border border-border-subtle text-foreground-muted hover:text-foreground hover:border-border-strong",
                )}
              >
                <Icon size={16} />
                <span className="text-[12px] font-medium">
                  {t(EQUIPMENT_LABEL[e], EQUIPMENT_LABEL_EN[e])}
                </span>
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline gap-2 px-1">
        <span className="text-[11px] uppercase tracking-[0.18em] text-foreground-dim">
          {label}
        </span>
        {hint && (
          <span className="text-[11px] text-foreground-dim">— {hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { BodyPart } from "@/lib/ai-recommend";
import { BODY_PART_LABEL } from "@/lib/ai-recommend";
import { useT } from "@/lib/i18n";

const BODY_PART_LABEL_EN: Record<BodyPart, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  arms: "Arms",
  core: "Core",
  legs: "Legs",
  full: "Full body",
};

interface Props {
  selected: BodyPart | null;
  onSelect: (part: BodyPart) => void;
}

// Muscle hotspots traced to the mannequin image's own pixel space (1536×2752,
// front-facing bodybuilder figure). Each zone is one or more SVG paths that
// follow the actual muscle panels; selecting a part lights its muscles lime.
// "back"/"full" are picked from the side menu.
const IMG_W = 1536;
const IMG_H = 2752;

const ZONES: { id: BodyPart; paths: string[] }[] = [
  {
    id: "chest", // pectorals (two plates)
    paths: [
      "M757 523 L660 498 L553 523 L520 622 L564 737 L725 770 Z",
      "M779 523 L876 498 L983 523 L1016 622 L972 737 L811 770 Z",
    ],
  },
  {
    id: "shoulders", // deltoids
    paths: [
      "M424 465 L520 498 L520 622 L424 671 L327 605 L338 506 Z",
      "M1112 465 L1016 498 L1016 622 L1112 671 L1209 605 L1198 506 Z",
    ],
  },
  {
    id: "arms", // upper arms / biceps
    paths: [
      "M424 671 L370 721 L348 894 L359 1035 L252 1018 L230 812 L295 671 Z",
      "M1112 671 L1166 721 L1188 894 L1177 1035 L1284 1018 L1306 812 L1241 671 Z",
    ],
  },
  {
    id: "core", // abdominals + obliques
    paths: [
      "M768 787 L600 790 L570 990 L640 1180 L768 1220 L896 1180 L966 990 L936 790 Z",
    ],
  },
  {
    id: "legs", // quads (thighs) + calves
    paths: [
      "M729 1306 L433 1328 L404 1577 L453 1780 L492 1859 L689 1859 L719 1633 Z",
      "M807 1306 L1103 1328 L1132 1577 L1083 1780 L1044 1859 L847 1859 L817 1633 Z",
      "M512 1893 L670 1915 L630 2198 L571 2277 L512 2254 L473 2028 Z",
      "M1024 1893 L866 1915 L906 2198 L965 2277 L1024 2254 L1063 2028 Z",
    ],
  },
];

export function BodySelector({ selected, onSelect }: Props) {
  const t = useT();
  return (
    <div className="grid grid-cols-[62%_1fr] gap-3 sm:grid-cols-[1fr_220px] sm:gap-10 items-center">
      {/* Mannequin figure with clickable muscle hotspots */}
      <div
        className="relative mx-auto w-full max-w-[240px] overflow-hidden rounded-3xl border border-border-subtle"
        style={{ aspectRatio: `${IMG_W} / ${IMG_H}` }}
      >
        <Image
          src="/discover/mannequin2.png"
          alt={t("부위 선택", "Body part selection")}
          fill
          sizes="240px"
          className="object-cover select-none pointer-events-none"
          priority
        />

        <svg
          viewBox={`0 0 ${IMG_W} ${IMG_H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <filter id="zoneGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {ZONES.map((z) => {
            const on = selected === z.id || selected === "full";
            return (
              <g
                key={z.id}
                onClick={() => onSelect(z.id)}
                className="cursor-pointer group"
                style={{ pointerEvents: "all" }}
              >
                {z.paths.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="var(--accent)"
                    stroke="var(--accent)"
                    strokeLinejoin="round"
                    filter={on ? "url(#zoneGlow)" : undefined}
                    className={cn(
                      "transition-all duration-200 [fill-opacity:0] [stroke-width:0]",
                      on
                        ? "[fill-opacity:0.44] [stroke-width:5px]"
                        : "group-hover:[fill-opacity:0.18] group-hover:[stroke-width:3px]",
                    )}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Side menu with all parts (incl. back and full body) */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-[0.18em] text-foreground-dim px-1 mb-1">
          {t("부위", "Body part")}
        </span>
        <div className="grid grid-cols-1 gap-2">
          {(Object.keys(BODY_PART_LABEL) as BodyPart[]).map((part) => {
            const isSelected = selected === part;
            return (
              <motion.button
                key={part}
                onClick={() => onSelect(part)}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "h-11 rounded-2xl px-4 text-[13px] font-medium transition-all flex items-center justify-between",
                  isSelected
                    ? "bg-accent text-black"
                    : "bg-surface-1 border border-border-subtle text-foreground-muted hover:text-foreground hover:border-border-strong",
                )}
              >
                <span>{t(BODY_PART_LABEL[part], BODY_PART_LABEL_EN[part])}</span>
                {isSelected && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

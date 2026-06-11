"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { BodyPart } from "@/lib/ai-recommend";
import { BODY_PART_LABEL } from "@/lib/ai-recommend";

interface Props {
  selected: BodyPart | null;
  onSelect: (part: BodyPart) => void;
}

// Clickable muscle hotspots overlaid on the mannequin image. Coordinates are in
// the image's own pixel space (1536×2752, front-facing full-body figure). Each
// zone is one or more ellipses (mirrored L↔R where relevant); selecting a part
// lights its zone with a lime glow. "back"/"full" are picked from the side menu.
const IMG_W = 1536;
const IMG_H = 2752;

type Ellipse = { cx: number; cy: number; rx: number; ry: number };

const ZONES: { id: BodyPart; shapes: Ellipse[] }[] = [
  {
    id: "shoulders",
    shapes: [
      { cx: 582, cy: 575, rx: 90, ry: 70 },
      { cx: 954, cy: 575, rx: 90, ry: 70 },
    ],
  },
  {
    id: "chest",
    shapes: [{ cx: 768, cy: 610, rx: 170, ry: 105 }],
  },
  {
    id: "arms",
    shapes: [
      { cx: 516, cy: 800, rx: 50, ry: 138 },
      { cx: 1020, cy: 800, rx: 50, ry: 138 },
    ],
  },
  {
    id: "core",
    shapes: [{ cx: 768, cy: 945, rx: 126, ry: 170 }],
  },
  {
    id: "legs",
    shapes: [
      { cx: 706, cy: 1610, rx: 86, ry: 250 },
      { cx: 830, cy: 1610, rx: 86, ry: 250 },
    ],
  },
];

export function BodySelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-6 sm:gap-10 items-center">
      {/* Mannequin figure with clickable muscle hotspots */}
      <div
        className="relative mx-auto w-full max-w-[240px] overflow-hidden rounded-3xl border border-border-subtle"
        style={{ aspectRatio: `${IMG_W} / ${IMG_H}` }}
      >
        <Image
          src="/discover/mannequin.png"
          alt="부위 선택"
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
            <filter id="zoneGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="14" result="blur" />
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
                {z.shapes.map((s, i) => (
                  <ellipse
                    key={i}
                    cx={s.cx}
                    cy={s.cy}
                    rx={s.rx}
                    ry={s.ry}
                    fill="var(--accent)"
                    stroke="var(--accent)"
                    filter={on ? "url(#zoneGlow)" : undefined}
                    className={cn(
                      "transition-all duration-200 [fill-opacity:0] [stroke-width:0]",
                      on
                        ? "[fill-opacity:0.28] [stroke-width:7px]"
                        : "group-hover:[fill-opacity:0.15] group-hover:[stroke-width:4px]",
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
          부위
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
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
                <span>{BODY_PART_LABEL[part]}</span>
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

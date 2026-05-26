"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { BodyPart } from "@/lib/ai-recommend";
import { BODY_PART_LABEL } from "@/lib/ai-recommend";

interface Props {
  selected: BodyPart | null;
  onSelect: (part: BodyPart) => void;
}

// SVG zones — each region is a path keyed by BodyPart.
// Coordinates are designed for a 200x420 viewBox.
const ZONES: { id: BodyPart; d: string; cx: number; cy: number }[] = [
  // Chest
  { id: "chest", d: "M70 95 Q100 80 130 95 L130 130 Q100 140 70 130 Z", cx: 100, cy: 113 },
  // Shoulders (two patches; we'll render as one Path using subpaths)
  {
    id: "shoulders",
    d:
      "M55 85 Q60 75 75 85 L78 100 Q66 102 55 100 Z " +
      "M145 85 Q140 75 125 85 L122 100 Q134 102 145 100 Z",
    cx: 100,
    cy: 92,
  },
  // Arms (upper arms; biceps area on both sides)
  {
    id: "arms",
    d:
      "M50 100 Q44 130 48 165 Q56 168 60 162 L62 105 Z " +
      "M150 100 Q156 130 152 165 Q144 168 140 162 L138 105 Z",
    cx: 100,
    cy: 135,
  },
  // Core
  { id: "core", d: "M70 135 L130 135 L128 200 Q100 210 72 200 Z", cx: 100, cy: 172 },
  // Back is conceptually "behind" — we show as a small badge below, not on SVG
  // (we'll add it as a card outside the SVG)
  // Legs
  {
    id: "legs",
    d:
      "M75 205 Q72 250 78 320 Q85 360 92 360 L98 215 Z " +
      "M125 205 Q128 250 122 320 Q115 360 108 360 L102 215 Z",
    cx: 100,
    cy: 290,
  },
];

export function BodySelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-6 sm:gap-10 items-center">
      {/* SVG body */}
      <div className="relative mx-auto">
        <svg
          viewBox="0 0 200 420"
          width="240"
          height="500"
          className="block"
          aria-label="부위 선택"
        >
          {/* Body silhouette */}
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--surface-2)" />
              <stop offset="100%" stopColor="var(--surface-1)" />
            </linearGradient>
            <filter id="zoneGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Head */}
          <circle
            cx="100"
            cy="40"
            r="22"
            fill="url(#bodyGrad)"
            stroke="var(--border-subtle)"
            strokeWidth="1"
          />
          {/* Neck */}
          <rect
            x="92"
            y="60"
            width="16"
            height="14"
            fill="url(#bodyGrad)"
            stroke="var(--border-subtle)"
          />
          {/* Torso */}
          <path
            d="M55 85 Q60 75 75 80 Q100 75 125 80 Q140 75 145 85 L150 165 Q148 200 130 205 L70 205 Q52 200 50 165 Z"
            fill="url(#bodyGrad)"
            stroke="var(--border-subtle)"
            strokeWidth="1"
          />
          {/* Hips/legs base */}
          <path
            d="M70 205 L130 205 L128 220 L72 220 Z"
            fill="url(#bodyGrad)"
            stroke="var(--border-subtle)"
          />
          {/* Legs silhouette */}
          <path
            d="M72 220 Q70 270 78 360 L96 360 L100 220 Z M128 220 Q130 270 122 360 L104 360 L100 220 Z"
            fill="url(#bodyGrad)"
            stroke="var(--border-subtle)"
          />
          {/* Arms silhouette */}
          <path
            d="M50 95 Q44 140 48 175 L62 175 L62 100 Z M150 95 Q156 140 152 175 L138 175 L138 100 Z"
            fill="url(#bodyGrad)"
            stroke="var(--border-subtle)"
          />

          {/* Interactive zones */}
          {ZONES.map((z) => {
            const isSelected = selected === z.id;
            return (
              <g key={z.id}>
                <path
                  d={z.d}
                  fill={isSelected ? "var(--accent)" : "transparent"}
                  fillOpacity={isSelected ? 0.85 : 0}
                  stroke={isSelected ? "var(--accent)" : "transparent"}
                  strokeWidth={isSelected ? 1.5 : 0}
                  className={cn(
                    "cursor-pointer transition-all duration-200",
                    !isSelected && "hover:fill-accent hover:fill-opacity-20",
                  )}
                  style={{ pointerEvents: "all" }}
                  onClick={() => onSelect(z.id)}
                  filter={isSelected ? "url(#zoneGlow)" : undefined}
                />
              </g>
            );
          })}

          {/* Selected label */}
          {selected && selected !== "full" && selected !== "back" && (
            <g pointerEvents="none">
              {(() => {
                const z = ZONES.find((x) => x.id === selected);
                if (!z) return null;
                return (
                  <text
                    x={z.cx}
                    y={z.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#0a0a0b"
                    style={{
                      letterSpacing: "0.05em",
                    }}
                  >
                    {BODY_PART_LABEL[selected]}
                  </text>
                );
              })()}
            </g>
          )}
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

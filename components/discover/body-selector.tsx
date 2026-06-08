"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { BodyPart } from "@/lib/ai-recommend";
import { BODY_PART_LABEL } from "@/lib/ai-recommend";

interface Props {
  selected: BodyPart | null;
  onSelect: (part: BodyPart) => void;
}

// Anatomical muscle groups — each interactive region is drawn as the actual
// muscle shape (delts / pecs / biceps / abs / quads), mirrored L↔R. Coordinates
// target a 240×520 viewBox (front-facing athletic figure). Selecting a part
// lights up that muscle group.
const ZONES: { id: BodyPart; d: string }[] = [
  {
    // Deltoids (shoulders)
    id: "shoulders",
    d:
      "M90 96 Q66 96 60 118 Q60 135 76 135 Q91 129 93 110 Z " +
      "M150 96 Q174 96 180 118 Q180 135 164 135 Q149 129 147 110 Z",
  },
  {
    // Pectorals (chest)
    id: "chest",
    d:
      "M118 102 Q96 100 84 114 Q80 133 92 145 Q108 149 118 140 Z " +
      "M122 102 Q144 100 156 114 Q160 133 148 145 Q132 149 122 140 Z",
  },
  {
    // Upper arms / biceps (arms)
    id: "arms",
    d:
      "M60 118 Q52 146 58 178 Q68 186 78 178 Q82 150 76 135 Q66 133 60 118 Z " +
      "M180 118 Q188 146 182 178 Q172 186 162 178 Q158 150 164 135 Q174 133 180 118 Z",
  },
  {
    // Abdominals + obliques (core)
    id: "core",
    d: "M92 145 Q88 168 94 200 Q104 214 120 215 Q136 214 146 200 Q152 168 148 145 Q134 152 120 152 Q106 152 92 145 Z",
  },
  {
    // Quadriceps (legs)
    id: "legs",
    d:
      "M96 246 Q88 300 94 366 Q104 378 116 372 Q120 308 118 250 Q106 252 96 246 Z " +
      "M144 246 Q152 300 146 366 Q136 378 124 372 Q120 308 122 250 Q134 252 144 246 Z",
  },
];

// Static body parts (not selectable) — frame the figure as one mannequin.
const STATIC_PARTS: string[] = [
  // Neck + trapezius yoke
  "M108 78 L132 78 L150 98 L90 98 Z",
  // Forearms
  "M58 178 Q54 206 60 236 Q68 242 76 236 Q80 208 78 178 Q68 186 58 178 Z",
  "M182 178 Q186 206 180 236 Q172 242 164 236 Q160 208 162 178 Q172 186 182 178 Z",
  // Hands
  "M59 236 Q54 252 64 257 Q74 255 76 240 Q68 242 59 236 Z",
  "M181 236 Q186 252 176 257 Q166 255 164 240 Q172 242 181 236 Z",
  // Pelvis / hips
  "M94 206 L146 206 Q152 230 146 250 Q120 262 94 250 Q88 230 94 206 Z",
  // Lower legs (calves)
  "M96 366 Q92 416 100 466 Q108 474 114 468 Q118 418 116 372 Q104 378 96 366 Z",
  "M144 366 Q148 416 140 466 Q132 474 126 468 Q122 418 124 372 Q136 378 144 366 Z",
  // Feet
  "M98 466 Q90 484 106 488 L118 486 L116 466 Z",
  "M142 466 Q150 484 134 488 L122 486 L124 466 Z",
];

// Muscle-definition grooves — subtle dark cuts that read as shadow on the dark
// body and as crisp separation over the lime-lit selected muscle.
const GROOVES: string[] = [
  // Pec split + under-pec curves
  "M120 104 L120 140",
  "M86 131 Q102 147 118 139",
  "M154 131 Q138 147 122 139",
  // Linea alba + the 6-pack rows
  "M120 150 L120 210",
  "M100 168 Q120 174 140 168",
  "M100 186 Q120 192 140 186",
  "M101 204 Q120 209 139 204",
  // Obliques
  "M94 158 Q91 186 100 210",
  "M146 158 Q149 186 140 210",
  // Deltoid caps
  "M62 116 Q76 109 91 117",
  "M178 116 Q164 109 149 117",
  // Biceps peaks
  "M61 135 Q66 158 74 177",
  "M179 135 Q174 158 166 177",
  // Quad sweep (rectus + outer)
  "M105 256 Q109 312 111 366",
  "M97 262 Q100 322 100 360",
  "M135 256 Q131 312 129 366",
  "M143 262 Q140 322 140 360",
  // Knees
  "M97 366 Q106 372 116 366",
  "M143 366 Q134 372 124 366",
  // Calves
  "M101 382 Q99 420 107 458",
  "M139 382 Q141 420 133 458",
];

export function BodySelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-6 sm:gap-10 items-center">
      {/* Anatomical figure */}
      <div className="relative mx-auto">
        <svg
          viewBox="0 0 240 520"
          className="block w-full max-w-[260px] mx-auto h-auto"
          aria-label="부위 선택"
        >
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="var(--surface-3)" />
              <stop offset="55%" stopColor="var(--surface-2)" />
              <stop offset="100%" stopColor="var(--surface-1)" />
            </linearGradient>
            <radialGradient id="muscleSheen" cx="42%" cy="30%" r="75%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
              <stop offset="60%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <filter id="zoneGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Soft floor shadow for grounding */}
          <ellipse
            cx="120"
            cy="498"
            rx="62"
            ry="9"
            fill="#000"
            opacity="0.25"
          />

          {/* Head */}
          <ellipse
            cx="120"
            cy="46"
            rx="19"
            ry="23"
            fill="url(#bodyGrad)"
            stroke="var(--border-subtle)"
            strokeWidth="1"
          />
          <path
            d="M108 70 L132 70 L131 82 L109 82 Z"
            fill="url(#bodyGrad)"
            stroke="var(--border-subtle)"
            strokeWidth="1"
          />

          {/* Static body parts */}
          {STATIC_PARTS.map((d, i) => (
            <path
              key={`s${i}`}
              d={d}
              fill="url(#bodyGrad)"
              stroke="var(--border-subtle)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          ))}

          {/* Interactive muscle groups */}
          {ZONES.map((z) => {
            const isSelected = selected === z.id;
            return (
              <path
                key={z.id}
                d={z.d}
                fill={isSelected ? "var(--accent)" : "url(#bodyGrad)"}
                fillOpacity={isSelected ? 0.92 : 1}
                stroke={isSelected ? "var(--accent)" : "var(--border-subtle)"}
                strokeWidth={isSelected ? 1.5 : 1}
                strokeLinejoin="round"
                className={cn(
                  "cursor-pointer transition-all duration-200 outline-none",
                  !isSelected &&
                    "hover:fill-accent hover:fill-opacity-25 hover:stroke-accent",
                )}
                style={{ pointerEvents: "all" }}
                onClick={() => onSelect(z.id)}
                filter={isSelected ? "url(#zoneGlow)" : undefined}
              />
            );
          })}

          {/* Sheen over the upper body for a sculpted, premium finish */}
          <path
            d="M90 96 Q66 96 60 118 L60 135 Q92 152 120 152 Q148 152 180 135 L180 118 Q174 96 150 96 L132 78 L108 78 Z"
            fill="url(#muscleSheen)"
            pointerEvents="none"
          />

          {/* Muscle-definition grooves */}
          <g
            stroke="#08080a"
            strokeOpacity="0.42"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
            pointerEvents="none"
          >
            {GROOVES.map((d, i) => (
              <path key={`g${i}`} d={d} />
            ))}
          </g>
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

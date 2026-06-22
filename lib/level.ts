// Level / 칭호 system — derived purely from a user's total finished-workout
// count. Seven gated tiers, comedic → epic. The XP bar measures progress from
// the current tier's threshold to the next one.

export type Locale = "ko" | "en";

export interface LevelTier {
  level: number; // 1..7
  title: string; // 칭호 (Korean)
  titleEn: string; // English title
  min: number; // workout count needed to reach this tier
  color: string; // tier color (hex) — tints nickname, badge, ring, etc.
}

export const LEVEL_TIERS: LevelTier[] = [
  { level: 1, title: "숨쉬기운동 달인", titleEn: "Breathing Champion", min: 0, color: "#ffffff" }, // 흰색
  { level: 2, title: "펄럭이는 종이인형", titleEn: "Flappy Paper Doll", min: 5, color: "#facc15" }, // 노란색
  { level: 3, title: "땀방울 수집가", titleEn: "Sweat Collector", min: 20, color: "#d4ff3f" }, // 라임색
  { level: 4, title: "태릉인 유망주", titleEn: "Rising Athlete", min: 50, color: "#3b82f6" }, // 파란색
  { level: 5, title: "걸어다니는 조각상", titleEn: "Walking Statue", min: 100, color: "#a855f7" }, // 보라색
  { level: 6, title: "인간 병기", titleEn: "Human Weapon", min: 200, color: "#22c55e" }, // 초록색 (번쩍)
  { level: 7, title: "최종 병기", titleEn: "Ultimate Weapon", min: 300, color: "#ffd700" }, // 금색 (번쩍)
];

// Localized tier title for a level number (clamped to a real tier).
export function levelTitle(level: number, locale: Locale): string {
  const idx = Math.min(Math.max(level, 1), LEVEL_TIERS.length) - 1;
  const tier = LEVEL_TIERS[idx];
  return locale === "en" ? tier.titleEn : tier.title;
}

// The top two tiers shimmer: 인간병기(초록) + 최종 병기(금).
export const SHIMMER_LEVEL = 6;

// Color for a given level number (clamped to a real tier).
export function levelColor(level: number): string {
  const idx = Math.min(Math.max(level, 1), LEVEL_TIERS.length) - 1;
  return LEVEL_TIERS[idx].color;
}

// Does this level use a shimmer treatment?
export function isShimmerLevel(level: number): boolean {
  return level >= SHIMMER_LEVEL;
}

// Which shimmer CSS class to apply (null if the level doesn't shimmer).
// 인간병기 → green shimmer, 최종 병기 → gold shimmer (same animation).
export function shimmerClass(level: number): string | null {
  if (!isShimmerLevel(level)) return null;
  return level >= 7 ? "level-gold" : "level-green";
}

export interface LevelInfo {
  level: number; // 1..7
  title: string; // current 칭호 (Korean)
  titleEn: string; // current title (English)
  count: number; // total finished workouts
  tierMin: number; // threshold of current tier
  nextMin: number | null; // threshold of next tier (null at max)
  nextTitle: string | null; // next 칭호 (Korean, null at max)
  nextTitleEn: string | null; // next title (English, null at max)
  toNext: number; // workouts remaining to next tier (0 at max)
  inTier: number; // workouts done within the current tier
  tierSpan: number; // size of current tier band (0 at max)
  progress: number; // 0..1 within current tier (1 at max)
  isMax: boolean;
}

// Map a workout count to its level/tier info.
export function getLevel(count: number): LevelInfo {
  const n = Math.max(0, Math.floor(count || 0));

  let idx = 0;
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (n >= LEVEL_TIERS[i].min) {
      idx = i;
      break;
    }
  }

  const tier = LEVEL_TIERS[idx];
  const next = LEVEL_TIERS[idx + 1] ?? null;
  const isMax = next === null;

  const tierMin = tier.min;
  const nextMin = next ? next.min : null;
  const inTier = n - tierMin;
  const tierSpan = next ? next.min - tierMin : 0;
  const progress = isMax ? 1 : tierSpan > 0 ? inTier / tierSpan : 0;
  const toNext = next ? next.min - n : 0;

  return {
    level: tier.level,
    title: tier.title,
    titleEn: tier.titleEn,
    count: n,
    tierMin,
    nextMin,
    nextTitle: next ? next.title : null,
    nextTitleEn: next ? next.titleEn : null,
    toNext,
    inTier,
    tierSpan,
    progress,
    isMax,
  };
}

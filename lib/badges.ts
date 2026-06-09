import type { WorkoutCompletion } from "@/lib/types";
import { dateKey, startOfDay, computeStreak } from "@/lib/history";

// ---------------------------------------------------------------------------
// Achievement badges — pure, client-side, derived entirely from the local
// `completions` log (+ the user's weekly goal). No new collection, no server:
// the same data that powers the calendar/streak/ring drives these too.
//
// Badges are MONOTONIC — every metric they key off (best streak, total count,
// goal-weeks, ever-did-an-early/late-workout) only ever goes up, so an earned
// badge never un-earns. That lets us store "seen" badges as a plain id set and
// diff against it to fire the one-time celebration.
// ---------------------------------------------------------------------------

export type BadgeCategory = "streak" | "total" | "goal" | "time";

export interface BadgeStats {
  total: number; // total completed workouts
  bestStreak: number; // longest consecutive-day run ever
  currentStreak: number; // streak ending today/yesterday (for display)
  goalWeeks: number; // # of weeks that met the weekly goal
  earlyBird: number; // # workouts before 06:00
  nightOwl: number; // # workouts at/after 22:00
}

export interface Badge {
  id: string;
  category: BadgeCategory;
  emoji: string;
  name: string; // display title
  short: string; // compact label for the share-card chip
  description: string; // requirement / earned text
  goal: number; // threshold to earn
  metric: keyof BadgeStats; // which stat this badge keys off
}

export interface BadgeProgress {
  badge: Badge;
  current: number;
  goal: number;
  earned: boolean;
  percent: number; // 0..1, clamped
}

// Definition list. Ordered by category then ascending difficulty — the grid
// renders them in this order.
export const BADGES: Badge[] = [
  // ── 연속 (streak) — keyed off best-ever streak ──────────────────────────
  { id: "streak-3", category: "streak", emoji: "🔥", name: "불씨", short: "3일 연속", description: "3일 연속 운동", goal: 3, metric: "bestStreak" },
  { id: "streak-7", category: "streak", emoji: "🔥", name: "한 주 완주", short: "7일 연속", description: "7일 연속 운동", goal: 7, metric: "bestStreak" },
  { id: "streak-14", category: "streak", emoji: "🔥", name: "꾸준함의 증거", short: "14일 연속", description: "14일 연속 운동", goal: 14, metric: "bestStreak" },
  { id: "streak-30", category: "streak", emoji: "🏔️", name: "철인", short: "30일 연속", description: "30일 연속 운동", goal: 30, metric: "bestStreak" },

  // ── 누적 (total count) ─────────────────────────────────────────────────
  { id: "total-1", category: "total", emoji: "🎬", name: "첫 발걸음", short: "첫 운동", description: "첫 운동 완료", goal: 1, metric: "total" },
  { id: "total-10", category: "total", emoji: "🏅", name: "워밍업 끝", short: "10회", description: "누적 10회 운동", goal: 10, metric: "total" },
  { id: "total-50", category: "total", emoji: "🥈", name: "단골 운동러", short: "50회", description: "누적 50회 운동", goal: 50, metric: "total" },
  { id: "total-100", category: "total", emoji: "🥇", name: "백 번의 땀", short: "100회", description: "누적 100회 운동", goal: 100, metric: "total" },

  // ── 주간 목표 (goal weeks) ──────────────────────────────────────────────
  { id: "goal-1", category: "goal", emoji: "🎯", name: "목표 달성", short: "목표 1주", description: "주간 목표 1주 달성", goal: 1, metric: "goalWeeks" },
  { id: "goal-4", category: "goal", emoji: "🏆", name: "한 달 완성", short: "목표 4주", description: "주간 목표 4주 달성", goal: 4, metric: "goalWeeks" },

  // ── 시간대 (time of day) — earn once ───────────────────────────────────
  { id: "earlybird", category: "time", emoji: "🌅", name: "얼리버드", short: "얼리버드", description: "오전 6시 이전 운동", goal: 1, metric: "earlyBird" },
  { id: "nightowl", category: "time", emoji: "🌙", name: "올빼미", short: "올빼미", description: "오후 10시 이후 운동", goal: 1, metric: "nightOwl" },
];

// Longest consecutive-day run across all history (independent of "ending today").
function computeBestStreak(days: Set<string>): number {
  if (days.size === 0) return 0;
  const times = [...days]
    .map((k) => {
      const [y, m, d] = k.split("-").map(Number);
      return new Date(y, m - 1, d).getTime();
    })
    .sort((a, b) => a - b);
  const DAY = 86_400_000;
  let best = 1;
  let run = 1;
  for (let i = 1; i < times.length; i++) {
    const gap = Math.round((times[i] - times[i - 1]) / DAY);
    if (gap === 1) run += 1;
    else if (gap > 1) run = 1;
    // gap === 0 shouldn't happen (set is by-day) — ignore.
    if (run > best) best = run;
  }
  return best;
}

export function computeBadgeStats(
  completions: WorkoutCompletion[],
  weeklyGoal: number,
): BadgeStats {
  const days = new Set<string>();
  let earlyBird = 0;
  let nightOwl = 0;
  // Completions per week, keyed by the week's Sunday (local).
  const perWeek = new Map<string, number>();

  for (const c of completions) {
    const d = new Date(c.completedAt);
    days.add(dateKey(d));
    const h = d.getHours();
    if (h < 6) earlyBird++;
    if (h >= 22) nightOwl++;
    const ws = startOfDay(d);
    ws.setDate(ws.getDate() - ws.getDay());
    const wk = dateKey(ws);
    perWeek.set(wk, (perWeek.get(wk) ?? 0) + 1);
  }

  let goalWeeks = 0;
  const target = Math.max(1, weeklyGoal);
  for (const n of perWeek.values()) if (n >= target) goalWeeks++;

  return {
    total: completions.length,
    bestStreak: computeBestStreak(days),
    currentStreak: computeStreak(days),
    goalWeeks,
    earlyBird,
    nightOwl,
  };
}

export function evaluateBadges(
  completions: WorkoutCompletion[],
  weeklyGoal: number,
): BadgeProgress[] {
  const stats = computeBadgeStats(completions, weeklyGoal);
  return BADGES.map((badge) => {
    const current = stats[badge.metric];
    const earned = current >= badge.goal;
    return {
      badge,
      current,
      goal: badge.goal,
      earned,
      percent: Math.max(0, Math.min(1, current / badge.goal)),
    };
  });
}

export function earnedBadgeIds(progress: BadgeProgress[]): string[] {
  return progress.filter((p) => p.earned).map((p) => p.badge.id);
}

// Pick the most impressive earned badge from each category (highest threshold),
// for featuring on the share card. Returns up to 4, in category order.
export function featuredBadges(progress: BadgeProgress[]): Badge[] {
  const order: BadgeCategory[] = ["streak", "total", "goal", "time"];
  const out: Badge[] = [];
  for (const cat of order) {
    const best = progress
      .filter((p) => p.earned && p.badge.category === cat)
      .sort((a, b) => b.goal - a.goal)[0];
    if (best) out.push(best.badge);
  }
  return out;
}

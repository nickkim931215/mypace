import type { RecordSnapshot, WorkoutCompletion } from "@/lib/types";

export type Locale = "ko" | "en";

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
export const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdays(locale: Locale): string[] {
  return locale === "en" ? WEEKDAYS_EN : WEEKDAYS;
}

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Localized "month year" label. `month` is 0-indexed (matches Date.getMonth()).
export function formatMonthLabel(
  year: number,
  month: number,
  locale: Locale,
): string {
  return locale === "en"
    ? `${MONTHS_EN[month]} ${year}`
    : `${year}년 ${month + 1}월`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// Local-time YYYY-MM-DD key (so a workout at 11pm counts for that local day).
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

// Consecutive days ending today (or yesterday, so the streak isn't shown as
// broken before today's workout is done).
export function computeStreak(days: Set<string>): number {
  let streak = 0;
  const cursor = startOfDay(new Date());
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Build the calendar cells for a month: leading nulls for the weekday offset,
// then one cell per day. Used by both the history view and the shared snapshot.
export function monthGrid(
  year: number,
  month: number,
): ({ day: number; key: string } | null)[] {
  const first = new Date(year, month, 1);
  const lead = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: ({ day: number; key: string } | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, key: dateKey(new Date(year, month, day)) });
  }
  return cells;
}

// Freeze the user's current history into a shareable snapshot for the given
// month (defaults handled by the caller). Streak / week / total are computed
// "as of now"; days[] holds the completed day-numbers within that month.
export function buildRecordSnapshot(
  completions: WorkoutCompletion[],
  year: number,
  month: number,
): RecordSnapshot {
  const days = new Set<string>();
  const dayNums = new Set<number>();
  let monthCount = 0;
  for (const c of completions) {
    const d = new Date(c.completedAt);
    days.add(dateKey(d));
    if (d.getFullYear() === year && d.getMonth() === month) {
      dayNums.add(d.getDate());
      monthCount++;
    }
  }

  const weekStart = startOfDay(new Date());
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekCount = completions.filter(
    (c) => c.completedAt >= weekStart.getTime(),
  ).length;

  return {
    streak: computeStreak(days),
    weekCount,
    totalCount: completions.length,
    year,
    month,
    monthLabel: `${year}년 ${month + 1}월`,
    monthCount,
    days: [...dayNums].sort((a, b) => a - b),
  };
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatClock(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

export type Locale = "ko" | "en";

export function formatDuration(totalSeconds: number, locale: Locale = "ko") {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (locale === "en") {
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    return `${s}s`;
  }
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return s > 0 ? `${m}분 ${s}초` : `${m}분`;
  return `${s}초`;
}

/**
 * Build a YouTube search deep-link for learning how to do an exercise.
 * We deliberately link to a *search* (not a single video ID): an LLM-guessed
 * video ID hallucinates dead/wrong links, whereas a search query always lands
 * on real, relevant results — and on mobile opens the YouTube app directly.
 * Biased toward Shorts so beginners get a quick form demo.
 */
export function youtubeLearnUrl(exerciseName: string, locale: Locale = "ko") {
  // Drop equipment qualifiers like "(덤벨)" so the search stays on the movement.
  const movement = exerciseName.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  const query =
    locale === "en"
      ? `${movement} exercise how to shorts`
      : `${movement} 운동 방법 shorts`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

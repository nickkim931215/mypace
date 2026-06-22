/* ──────────────────────────────────────────────────────────────
   MyPace — Motivational ("hype") music manifest
   ────────────────────────────────────────────────────────────────
   These are the lyric-driven tracks that play during a workout when
   the user picks the 동기부여 audio mode. Three "spice levels":

     mild   (순한맛)   — purely positive, encouraging lyrics
     medium (덜매운맛) — pointed but not brutal
     spicy  (매운맛)   — savage diet-shaming roast lyrics 🔥

   Audio files live in the app's own `public/` folder (served by Vercel
   — no Firebase Storage, no billing). To add a song:
     1. Drop the mp3 into  public/music/hype/<flavor>/<file>.mp3
     2. Add one entry to the matching array below.
   The path you put in `src` is just the public URL: "/music/...".
   ────────────────────────────────────────────────────────────── */

export type HypeFlavor = "mild" | "medium" | "spicy";
/** BGM is instrumental (no lyrics). Two moods. */
export type BgmMood = "boost" | "flow";

export interface MusicTrack {
  /** Stable id (use the filename without extension). */
  id: string;
  title: string;
  artist?: string;
  /**
   * Audio URL. Normally a public path served from `public/`, e.g.
   * "/music/hype/spicy/01-burn.mp3". A full "https://…" URL also works
   * if you ever host elsewhere.
   */
  src: string;
}

export const BGM_ORDER: BgmMood[] = ["boost", "flow"];

export const BGM_META: Record<
  BgmMood,
  {
    label: string;
    labelEn: string;
    emoji: string;
    tagline: string;
    taglineEn: string;
    accent: string;
  }
> = {
  boost: {
    label: "부스트",
    labelEn: "Boost",
    emoji: "⚡",
    tagline: "심박수 끌어올리는 비트",
    taglineEn: "Beats that lift your heart rate",
    accent: "var(--accent)",
  },
  flow: {
    label: "플로우",
    labelEn: "Flow",
    emoji: "🌊",
    tagline: "흐름 타는 잔잔한 사운드",
    taglineEn: "Calm sounds to ride the flow",
    accent: "var(--rest)",
  },
};

export const FLAVOR_ORDER: HypeFlavor[] = ["mild", "medium", "spicy"];

export const FLAVOR_META: Record<
  HypeFlavor,
  {
    label: string;
    labelEn: string;
    emoji: string;
    tagline: string;
    taglineEn: string;
    accent: string;
  }
> = {
  mild: {
    label: "순한맛",
    labelEn: "Mild",
    emoji: "🌱",
    tagline: "긍정·응원으로만 가득",
    taglineEn: "Pure positivity and cheering",
    accent: "var(--rest)",
  },
  medium: {
    label: "덜매운맛",
    labelEn: "Medium",
    emoji: "🌶️",
    tagline: "적당히 따끔한 자극",
    taglineEn: "A pointed but fair nudge",
    accent: "#f59e0b",
  },
  spicy: {
    label: "매운맛",
    labelEn: "Spicy",
    emoji: "🔥",
    tagline: "악담 수준의 다이어트 쓴소리",
    taglineEn: "Savage diet roasting 🔥",
    accent: "#ef4444",
  },
};

/**
 * Fill these arrays as you drop mp3s into public/music/hype/<flavor>/.
 * Aim for ~5–10 per flavor; the player shuffles and plays continuously.
 *
 * Example entry:
 *   { id: "01-burn", title: "지방을 태워라", src: "/music/hype/spicy/01-burn.mp3" }
 */
export const HYPE_TRACKS: Record<HypeFlavor, MusicTrack[]> = {
  mild: [
    { id: "mild1", title: "순한맛 1", src: "/music/hype/mild/mild1.mp3" },
  ],
  medium: [],
  spicy: [
    { id: "spicy1", title: "매운맛 1", src: "/music/hype/spicy/spicy1.mp3" },
    { id: "spicy2", title: "매운맛 2", src: "/music/hype/spicy/spicy2.mp3" },
    { id: "spicy3", title: "매운맛 3", src: "/music/hype/spicy/spicy3.mp3" },
    { id: "spicy4", title: "매운맛 4", src: "/music/hype/spicy/spicy4.mp3" },
    { id: "spicy5", title: "매운맛 5", src: "/music/hype/spicy/spicy5.mp3" },
    { id: "spicy6", title: "매운맛 6", src: "/music/hype/spicy/spicy6.mp3" },
    { id: "spicy7", title: "매운맛 7", src: "/music/hype/spicy/spicy7.mp3" },
  ],
};

/**
 * Instrumental BGM, no lyrics. Drop mp3s into public/music/bgm/<mood>/.
 * Until filled, the player falls back to a synthesized melody loop.
 *
 * Example entry:
 *   { id: "01", title: "아드레날린", src: "/music/bgm/boost/01.mp3" }
 */
export const BGM_TRACKS: Record<BgmMood, MusicTrack[]> = {
  boost: [],
  flow: [],
};

export function tracksFor(flavor: HypeFlavor): MusicTrack[] {
  return HYPE_TRACKS[flavor] ?? [];
}

export function bgmTracksFor(mood: BgmMood): MusicTrack[] {
  return BGM_TRACKS[mood] ?? [];
}

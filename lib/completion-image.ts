import { LEVEL_TIERS, levelColor } from "@/lib/level";
import type { Locale } from "@/lib/history";

// Renders a shareable "workout complete" card as a PNG Blob, matching the
// MyPace dark + lime brand and the 1080×1350 (Instagram portrait) record card.
// Fired right after a run finishes so the user can brag about the session they
// just did. Pure client canvas — no backend, no upload.

const W = 1080;
const H = 1350;

// Brand tokens (kept in sync with app/globals.css :root).
const BG = "#0a0a0b";
const SURFACE = "#16161a";
const ACCENT = "#d4ff3f";
const FG = "#fafafa";
const FG_MUTED = "#9ca3af";
const FG_DIM = "#6b7280";

const FONT = '"Pretendard Variable", "Inter", system-ui, sans-serif';

export interface CompletionCardData {
  routineName: string;
  /** Total workout time in seconds (already multiplied by repeat). */
  totalDurationSec: number;
  /** Number of rounds in one set. */
  rounds: number;
  /** Number of sets (routine.repeat). */
  sets: number;
  /** When the workout finished (epoch ms). */
  dateMs: number;
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function fmtDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

// Shrink a font so the text fits within maxW; returns the chosen px size.
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number,
  startPx: number,
  minPx: number,
  maxW: number,
): number {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${FONT}`;
  while (px > minPx && ctx.measureText(text).width > maxW) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${FONT}`;
  }
  return px;
}

export async function renderCompletionCard(
  data: CompletionCardData,
  nickname: string,
  level?: number,
  locale: Locale = "ko",
): Promise<Blob> {
  const en = locale === "en";
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* fonts API best-effort */
    }
  }

  const dpr = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.scale(dpr, dpr);

  // ── Background: deep base + two soft accent glows ──────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const topGlow = ctx.createRadialGradient(W * 0.5, -120, 0, W * 0.5, -120, 820);
  topGlow.addColorStop(0, "rgba(212, 255, 63, 0.2)");
  topGlow.addColorStop(1, "rgba(212, 255, 63, 0)");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, 760);
  const cornerGlow = ctx.createRadialGradient(-80, H + 80, 0, -80, H + 80, 560);
  cornerGlow.addColorStop(0, "rgba(212, 255, 63, 0.08)");
  cornerGlow.addColorStop(1, "rgba(212, 255, 63, 0)");
  ctx.fillStyle = cornerGlow;
  ctx.fillRect(0, H - 560, 560, 560);

  const PAD = 84;
  const innerW = W - PAD * 2;

  // ── Header band: brand (left) + @nickname (right) ──────────────────────
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(PAD + 8, 92, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = "left";
  ctx.fillStyle = FG;
  ctx.font = `800 38px ${FONT}`;
  ctx.fillText("MyPace", PAD + 28, 104);
  ctx.fillStyle = FG_DIM;
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText(en ? "Workout Interval Timer" : "운동 인터벌 타이머", PAD + 2, 140);

  // @nickname pill, right-aligned, vertically centered with the wordmark.
  const handle = `@${nickname}`;
  ctx.font = `600 26px ${FONT}`;
  const handleW = ctx.measureText(handle).width;
  const hpW = handleW + 48;
  const hpH = 56;
  const hpX = W - PAD - hpW;
  const hpY = 78;
  rr(ctx, hpX, hpY, hpW, hpH, hpH / 2);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = level ? levelColor(level) : FG_MUTED;
  ctx.textAlign = "center";
  ctx.fillText(handle, hpX + hpW / 2, hpY + 37);

  // Level / 칭호 chip under the @nickname.
  if (level && level >= 1) {
    const tier = LEVEL_TIERS[Math.min(level, LEVEL_TIERS.length) - 1];
    const lvText = `Lv.${tier.level} · ${en ? tier.titleEn : tier.title}`;
    ctx.font = `700 23px ${FONT}`;
    const lvW = ctx.measureText(lvText).width;
    const lpW = lvW + 36;
    const lpH = 40;
    const lpX = W - PAD - lpW;
    const lpY = hpY + hpH + 8;
    rr(ctx, lpX, lpY, lpW, lpH, lpH / 2);
    if (level >= LEVEL_TIERS.length) {
      const g = ctx.createLinearGradient(lpX, 0, lpX + lpW, 0);
      g.addColorStop(0, "#a8791a");
      g.addColorStop(0.5, "#fff7cc");
      g.addColorStop(1, "#ffd700");
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = tier.color;
    }
    ctx.fill();
    ctx.fillStyle = BG;
    ctx.textAlign = "center";
    ctx.fillText(lvText, lpX + lpW / 2, lpY + 27);
  }

  // gradient divider under the header
  const divGrad = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  divGrad.addColorStop(0, "rgba(212,255,63,0.5)");
  divGrad.addColorStop(0.6, "rgba(255,255,255,0.06)");
  divGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = divGrad;
  ctx.fillRect(PAD, 184, innerW, 2);

  // ── Hero: big lime check badge ─────────────────────────────────────────
  const badgeCx = W / 2;
  const badgeCy = 400;
  const badgeR = 108;
  const badgeGlow = ctx.createRadialGradient(
    badgeCx,
    badgeCy,
    0,
    badgeCx,
    badgeCy,
    badgeR * 2.4,
  );
  badgeGlow.addColorStop(0, "rgba(212,255,63,0.28)");
  badgeGlow.addColorStop(1, "rgba(212,255,63,0)");
  ctx.fillStyle = badgeGlow;
  ctx.beginPath();
  ctx.arc(badgeCx, badgeCy, badgeR * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(badgeCx, badgeCy, badgeR, 0, Math.PI * 2);
  ctx.fill();
  // checkmark
  ctx.strokeStyle = BG;
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(badgeCx - 46, badgeCy + 4);
  ctx.lineTo(badgeCx - 12, badgeCy + 40);
  ctx.lineTo(badgeCx + 52, badgeCy - 40);
  ctx.stroke();

  // ── Eyebrow + routine name (centered) ──────────────────────────────────
  ctx.textAlign = "center";
  ctx.fillStyle = ACCENT;
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText(
    en ? "WORKOUT COMPLETE" : "운동 완료",
    badgeCx,
    badgeCy + badgeR + 78,
  );

  const namePx = fitFont(ctx, data.routineName, 800, 68, 40, innerW);
  ctx.fillStyle = FG;
  ctx.font = `800 ${namePx}px ${FONT}`;
  ctx.fillText(data.routineName, badgeCx, badgeCy + badgeR + 78 + 74);

  // ── Big total time ─────────────────────────────────────────────────────
  const timeY = badgeCy + badgeR + 78 + 74 + 128;
  ctx.fillStyle = FG;
  ctx.font = `800 132px ${FONT}`;
  const timeText = fmtDuration(data.totalDurationSec);
  ctx.fillText(timeText, badgeCx, timeY);
  ctx.fillStyle = FG_DIM;
  ctx.font = `600 24px ${FONT}`;
  ctx.fillText(en ? "TOTAL TIME" : "총 운동 시간", badgeCx, timeY + 44);

  // ── Stat card: rounds · sets · date ────────────────────────────────────
  const cardY = timeY + 108;
  const cardH = H - PAD - cardY;
  rr(ctx, PAD, cardY, innerW, cardH, 32);
  ctx.fillStyle = SURFACE;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const dateStr = new Date(data.dateMs).toLocaleDateString(
    en ? "en-US" : "ko-KR",
    { month: en ? "short" : "long", day: "numeric" },
  );
  const midY = cardY + cardH / 2;
  drawStat(
    ctx,
    PAD + innerW * (1 / 6),
    midY,
    `${data.rounds}`,
    en ? "rounds" : "라운드",
    true,
  );
  drawStat(
    ctx,
    PAD + innerW * (3 / 6),
    midY,
    `${data.sets}`,
    en ? "sets" : "세트",
    false,
  );
  drawStat(ctx, PAD + innerW * (5 / 6), midY, dateStr, en ? "date" : "날짜", false);
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(PAD + innerW * (2 / 6), midY - 34, 1, 84);
  ctx.fillRect(PAD + innerW * (4 / 6), midY - 34, 1, 84);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
      0.95,
    );
  });
}

// One stat: big accent/fg value with a muted label beneath, centered on cx.
function drawStat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  value: string,
  label: string,
  accent: boolean,
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const valuePx = fitFont(ctx, value, 800, 46, 28, 260);
  ctx.fillStyle = accent ? ACCENT : FG;
  ctx.font = `800 ${valuePx}px ${FONT}`;
  ctx.fillText(value, cx, y);
  ctx.fillStyle = FG_DIM;
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText(label, cx, y + 40);
}

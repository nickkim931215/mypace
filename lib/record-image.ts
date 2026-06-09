import type { RecordSnapshot } from "@/lib/types";
import { monthGrid, WEEKDAYS } from "@/lib/history";

// Renders a shareable workout-record card as a PNG Blob, using the MyPace
// dark + lime brand. Sized 1080×1350 (Instagram portrait) so it looks right
// dropped into a story/feed or a KakaoTalk chat. Pure client canvas — no
// backend, no upload.

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

export async function renderRecordCard(
  snapshot: RecordSnapshot,
  nickname: string,
): Promise<Blob> {
  // Make sure the brand font is ready so text doesn't draw in a fallback face.
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
  topGlow.addColorStop(0, "rgba(212, 255, 63, 0.18)");
  topGlow.addColorStop(1, "rgba(212, 255, 63, 0)");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, 700);
  const cornerGlow = ctx.createRadialGradient(
    W + 80,
    H + 80,
    0,
    W + 80,
    H + 80,
    560,
  );
  cornerGlow.addColorStop(0, "rgba(212, 255, 63, 0.08)");
  cornerGlow.addColorStop(1, "rgba(212, 255, 63, 0)");
  ctx.fillStyle = cornerGlow;
  ctx.fillRect(W - 560, H - 560, 560, 560);

  const PAD = 84;
  const innerW = W - PAD * 2;

  // ── Header band: brand (left) + @nickname (right) ──────────────────────
  ctx.textBaseline = "alphabetic";
  // accent dot
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
  ctx.fillText("운동 인터벌 타이머", PAD + 2, 140);

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
  ctx.fillStyle = FG_MUTED;
  ctx.textAlign = "center";
  ctx.fillText(handle, hpX + hpW / 2, hpY + 37);

  // gradient divider under the header
  const divY = 184;
  const divGrad = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  divGrad.addColorStop(0, "rgba(212,255,63,0.5)");
  divGrad.addColorStop(0.6, "rgba(255,255,255,0.06)");
  divGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = divGrad;
  ctx.fillRect(PAD, divY, innerW, 2);

  // ── Hero: month eyebrow + big count ────────────────────────────────────
  ctx.textAlign = "left";
  ctx.fillStyle = ACCENT;
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText(snapshot.monthLabel, PAD, 268);

  ctx.fillStyle = FG;
  ctx.font = `800 120px ${FONT}`;
  const big = `${snapshot.monthCount}`;
  ctx.fillText(big, PAD, 384);
  const bigW = ctx.measureText(big).width;
  ctx.fillStyle = FG_MUTED;
  ctx.font = `600 46px ${FONT}`;
  ctx.fillText("회 운동", PAD + bigW + 20, 384);

  // ── Inline stats bar: 연속 · 이번 주 · 누적 ────────────────────────────
  const statsY = 440;
  drawStat(ctx, PAD + innerW * (1 / 6), statsY, `${snapshot.streak}`, "일 연속", true);
  drawStat(ctx, PAD + innerW * (3 / 6), statsY, `${snapshot.weekCount}`, "이번 주", false);
  drawStat(ctx, PAD + innerW * (5 / 6), statsY, `${snapshot.totalCount}`, "누적", false);
  // thin separators between stats
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(PAD + innerW * (2 / 6), statsY - 6, 1, 56);
  ctx.fillRect(PAD + innerW * (4 / 6), statsY - 6, 1, 56);

  // ── Calendar card (always fits 6 rows within the canvas) ───────────────
  const calY = 560;
  const calPad = 36;
  const headerH = 52;
  const gap = 12;
  const availH = H - PAD - calY; // vertical room left for the card
  const cellByW = (innerW - calPad * 2 - gap * 6) / 7;
  const cellByH = (availH - calPad * 2 - headerH - gap * 5) / 6; // reserve 6 rows
  const cell = Math.floor(Math.min(cellByW, cellByH));

  const cells = monthGrid(snapshot.year, snapshot.month);
  const rows = Math.ceil(cells.length / 7);
  const gridW = cell * 7 + gap * 6;
  const calH = calPad * 2 + headerH + rows * cell + (rows - 1) * gap;
  const calX = PAD;
  const calW = innerW;

  rr(ctx, calX, calY, calW, calH, 32);
  ctx.fillStyle = SURFACE;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // center the grid horizontally inside the card
  const gridX = calX + (calW - gridW) / 2;
  const gridY = calY + calPad;
  const doneDays = new Set(snapshot.days);

  // weekday header
  ctx.textAlign = "center";
  ctx.font = `600 24px ${FONT}`;
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i === 0 ? "rgba(239,68,68,0.7)" : FG_DIM;
    const cx = gridX + i * (cell + gap) + cell / 2;
    ctx.fillText(WEEKDAYS[i], cx, gridY + 22);
  }

  // day cells
  cells.forEach((c, idx) => {
    if (!c) return;
    const col = idx % 7;
    const row = Math.floor(idx / 7);
    const x = gridX + col * (cell + gap);
    const y = gridY + headerH + row * (cell + gap);
    const done = doneDays.has(c.day);
    const radius = Math.min(18, cell * 0.28);
    if (done) {
      rr(ctx, x, y, cell, cell, radius);
      ctx.fillStyle = "rgba(212, 255, 63, 0.16)";
      ctx.fill();
      ctx.strokeStyle = "rgba(212, 255, 63, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.fillStyle = done ? ACCENT : "rgba(255,255,255,0.42)";
    ctx.font = `${done ? 700 : 500} ${Math.round(cell * 0.34)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${c.day}`, x + cell / 2, y + cell / 2 + 1);
  });
  ctx.textBaseline = "alphabetic";

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
  ctx.fillStyle = accent ? ACCENT : FG;
  ctx.font = `800 44px ${FONT}`;
  ctx.fillText(value, cx, y + 16);
  ctx.fillStyle = FG_DIM;
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText(label, cx, y + 46);
}

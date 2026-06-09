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
const SURFACE_2 = "#1f1f25";
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

  // Background + soft accent glow at the top.
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 40, 0, W / 2, 40, 720);
  glow.addColorStop(0, "rgba(212, 255, 63, 0.16)");
  glow.addColorStop(1, "rgba(212, 255, 63, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 760);

  const PAD = 84;
  const innerW = W - PAD * 2;

  // ── Header: wordmark + streak pill ──────────────────────────────────────
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(PAD + 9, 96, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = FG;
  ctx.font = `700 34px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("MyPace", PAD + 30, 108);

  // Streak pill, right-aligned.
  const streakText = `${snapshot.streak}일 연속`;
  ctx.font = `700 28px ${FONT}`;
  const pillTextW = ctx.measureText(streakText).width;
  const flameW = 34;
  const pillW = pillTextW + flameW + 56;
  const pillH = 58;
  const pillX = W - PAD - pillW;
  const pillY = 70;
  rr(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = "rgba(212, 255, 63, 0.12)";
  ctx.fill();
  ctx.font = "28px sans-serif";
  ctx.fillText("🔥", pillX + 26, pillY + 39);
  ctx.fillStyle = ACCENT;
  ctx.font = `700 28px ${FONT}`;
  ctx.fillText(streakText, pillX + 26 + flameW + 6, pillY + 39);

  // ── Hero: month + count ─────────────────────────────────────────────────
  ctx.textAlign = "left";
  ctx.fillStyle = FG_DIM;
  ctx.font = `600 26px ${FONT}`;
  ctx.fillText(snapshot.monthLabel.toUpperCase(), PAD, 248);

  ctx.fillStyle = FG;
  ctx.font = `800 110px ${FONT}`;
  const big = `${snapshot.monthCount}`;
  ctx.fillText(big, PAD, 360);
  const bigW = ctx.measureText(big).width;
  ctx.fillStyle = FG_MUTED;
  ctx.font = `600 46px ${FONT}`;
  ctx.fillText("회 운동", PAD + bigW + 18, 360);

  // ── Calendar card ───────────────────────────────────────────────────────
  const calX = PAD;
  const calY = 430;
  const calW = innerW;
  const cells = monthGrid(snapshot.year, snapshot.month);
  const rows = Math.ceil(cells.length / 7);
  const headerH = 56;
  const cellGap = 12;
  const calPad = 36;
  const gridW = calW - calPad * 2;
  const cellSize = (gridW - cellGap * 6) / 7;
  const calH = calPad * 2 + headerH + rows * cellSize + (rows - 1) * cellGap;

  rr(ctx, calX, calY, calW, calH, 32);
  ctx.fillStyle = SURFACE;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const gridX = calX + calPad;
  const gridY = calY + calPad;
  const doneDays = new Set(snapshot.days);

  // Weekday header.
  ctx.textAlign = "center";
  ctx.font = `600 24px ${FONT}`;
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i === 0 ? "rgba(239,68,68,0.7)" : FG_DIM;
    const cx = gridX + i * (cellSize + cellGap) + cellSize / 2;
    ctx.fillText(WEEKDAYS[i], cx, gridY + 24);
  }

  // Day cells.
  ctx.font = `600 30px ${FONT}`;
  cells.forEach((cell, idx) => {
    const col = idx % 7;
    const row = Math.floor(idx / 7);
    const x = gridX + col * (cellSize + cellGap);
    const y = gridY + headerH + row * (cellSize + cellGap);
    if (!cell) return;
    const done = doneDays.has(cell.day);
    if (done) {
      rr(ctx, x, y, cellSize, cellSize, 18);
      ctx.fillStyle = "rgba(212, 255, 63, 0.18)";
      ctx.fill();
    }
    ctx.fillStyle = done ? ACCENT : FG_MUTED;
    ctx.font = `${done ? 700 : 500} 30px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${cell.day}`, x + cellSize / 2, y + cellSize / 2 + 2);
    // small dot under completed days
    if (done) {
      ctx.beginPath();
      ctx.arc(x + cellSize / 2, y + cellSize - 16, 4, 0, Math.PI * 2);
      ctx.fillStyle = ACCENT;
      ctx.fill();
    }
  });
  ctx.textBaseline = "alphabetic";

  // ── Stat strip: 이번 주 / 누적 ──────────────────────────────────────────
  const stripY = calY + calH + 36;
  const stripH = 132;
  const gap = 20;
  const halfW = (innerW - gap) / 2;
  drawStat(ctx, PAD, stripY, halfW, stripH, "이번 주", `${snapshot.weekCount}회`);
  drawStat(
    ctx,
    PAD + halfW + gap,
    stripY,
    halfW,
    stripH,
    "누적 완료",
    `${snapshot.totalCount}회`,
  );

  // ── Footer ──────────────────────────────────────────────────────────────
  const footY = H - 70;
  ctx.textAlign = "left";
  ctx.fillStyle = FG;
  ctx.font = `600 30px ${FONT}`;
  ctx.fillText(`@${nickname}`, PAD, footY);
  ctx.textAlign = "right";
  ctx.fillStyle = FG_DIM;
  ctx.font = `500 26px ${FONT}`;
  ctx.fillText("mypace · 운동 인터벌 타이머", W - PAD, footY);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
      0.95,
    );
  });
}

function drawStat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
) {
  rr(ctx, x, y, w, h, 26);
  ctx.fillStyle = SURFACE_2;
  ctx.fill();
  ctx.textAlign = "center";
  ctx.fillStyle = FG;
  ctx.font = `700 52px ${FONT}`;
  ctx.fillText(value, x + w / 2, y + 70);
  ctx.fillStyle = FG_DIM;
  ctx.font = `500 24px ${FONT}`;
  ctx.fillText(label, x + w / 2, y + 104);
}

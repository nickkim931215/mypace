import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  BANNER_PRICING,
  formatPrice,
  validateInquiry,
  type InquiryInput,
} from "@/lib/inquiry";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = validateInquiry(body);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: 400 },
    );
  }

  const inquiry = result.value;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL || user;

  // No SMTP creds → log and pretend success in dev so UI flow is testable.
  if (!user || !pass) {
    console.warn(
      "[inquiry] GMAIL_USER / GMAIL_APP_PASSWORD missing — skipping email send.",
    );
    console.info("[inquiry] would-send:", inquiry);
    return NextResponse.json({
      ok: true,
      delivered: false,
      reason: "smtp_not_configured",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"MyPace 광고문의" <${user}>`,
      to: adminEmail,
      replyTo: undefined,
      subject: buildSubject(inquiry),
      text: buildTextBody(inquiry),
      html: buildHtmlBody(inquiry),
    });

    return NextResponse.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("[inquiry] sendMail failed:", err);
    return NextResponse.json(
      { error: "이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }
}

function buildSubject(i: InquiryInput): string {
  return `[MyPace 광고문의] 배너 ${i.bannerSlot}번 / ${i.durationDays}일 — ${i.name}`;
}

function buildTextBody(i: InquiryInput): string {
  const price = formatPrice(BANNER_PRICING[i.durationDays]);
  return [
    `■ 광고주: ${i.name}`,
    `■ 연락처: ${i.phone}`,
    `■ 희망 배너: ${i.bannerSlot}번`,
    `■ 노출 기간: ${i.durationDays}일 (${price})`,
    `■ YouTube URL: ${i.youtubeUrl}`,
    "",
    "■ 메시지:",
    i.message || "(없음)",
    "",
    "—",
    `접수 시각: ${new Date().toISOString()}`,
  ].join("\n");
}

function buildHtmlBody(i: InquiryInput): string {
  const price = formatPrice(BANNER_PRICING[i.durationDays]);
  const esc = (s: string) =>
    s.replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
    );
  return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;color:#111">
  <h2 style="margin:0 0 16px">MyPace 광고 문의</h2>
  <table style="border-collapse:collapse;width:100%;font-size:14px">
    <tbody>
      ${row("광고주", esc(i.name))}
      ${row("연락처", esc(i.phone))}
      ${row("희망 배너", `${i.bannerSlot}번`)}
      ${row("노출 기간", `${i.durationDays}일 · ${price}`)}
      ${row("YouTube", `<a href="${esc(i.youtubeUrl)}">${esc(i.youtubeUrl)}</a>`)}
      ${i.message ? row("메시지", esc(i.message).replace(/\n/g, "<br>")) : ""}
    </tbody>
  </table>
  <p style="margin-top:24px;font-size:12px;color:#888">접수 시각: ${new Date().toLocaleString("ko-KR")}</p>
</div>`;
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:8px 12px 8px 0;color:#666;width:120px;vertical-align:top">${label}</td><td style="padding:8px 0">${value}</td></tr>`;
}

import { NextResponse } from "next/server";
import webpush, { type PushSubscription } from "web-push";

export const runtime = "nodejs";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:nickkim931215@gmail.com";

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
  configured = true;
  return true;
}

export async function POST(req: Request) {
  // No keys → behave like the inquiry route: report gracefully, don't 500.
  if (!ensureConfigured()) {
    console.warn("[push] VAPID keys missing — cannot send test push.");
    return NextResponse.json(
      { error: "푸시 서버 키가 설정되지 않았어요. (관리자 설정 필요)" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const subscription = (body as { subscription?: PushSubscription })
    ?.subscription;
  if (!subscription || typeof subscription.endpoint !== "string") {
    return NextResponse.json(
      { error: "구독 정보가 올바르지 않아요." },
      { status: 400 },
    );
  }

  const payload = JSON.stringify({
    title: "MyPace · 테스트 알림",
    body: "알림이 정상적으로 도착했어요! 💪 이제 매일 운동 시간을 챙겨드릴게요.",
    url: "/timer",
    tag: "mypace-test",
  });

  try {
    await webpush.sendNotification(subscription, payload);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    console.error("[push] sendNotification failed:", statusCode, err);
    // 404/410 = subscription expired/unsubscribed on the push service side.
    if (statusCode === 404 || statusCode === 410) {
      return NextResponse.json(
        { error: "구독이 만료됐어요. 알림을 다시 켜주세요." },
        { status: 410 },
      );
    }
    return NextResponse.json(
      { error: "알림 전송에 실패했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }
}

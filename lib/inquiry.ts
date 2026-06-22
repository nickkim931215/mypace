export type BannerSlot = 1 | 2 | 3 | 4;

export interface InquiryInput {
  youtubeUrl: string;
  name: string;
  phone: string;
  bannerSlot: BannerSlot;
  durationDays: 30 | 60 | 90;
  message?: string;
}

export const BANNER_PRICING: Record<30 | 60 | 90, number> = {
  30: 100_000,
  60: 180_000,
  90: 250_000,
};

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

export function isValidYoutubeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return YOUTUBE_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

const PHONE_RE = /^[\d\s\-+()]{9,20}$/;

// Stable codes so the client can render a localized validation message; `error`
// keeps a Korean string as the default/fallback (used by the server route).
export type InquiryErrorCode =
  | "bad_format"
  | "bad_youtube"
  | "bad_name"
  | "bad_phone"
  | "bad_slot"
  | "bad_duration";

export function validateInquiry(input: unknown): {
  ok: true;
  value: InquiryInput;
} | { ok: false; error: string; code: InquiryErrorCode } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "잘못된 요청 형식입니다.", code: "bad_format" };
  }
  const i = input as Record<string, unknown>;

  const youtubeUrl = typeof i.youtubeUrl === "string" ? i.youtubeUrl.trim() : "";
  const name = typeof i.name === "string" ? i.name.trim() : "";
  const phone = typeof i.phone === "string" ? i.phone.trim() : "";
  const bannerSlot = Number(i.bannerSlot);
  const durationDays = Number(i.durationDays);
  const message =
    typeof i.message === "string" ? i.message.trim().slice(0, 1000) : undefined;

  if (!isValidYoutubeUrl(youtubeUrl)) {
    return { ok: false, error: "유효한 YouTube URL을 입력해주세요.", code: "bad_youtube" };
  }
  if (name.length < 1 || name.length > 40) {
    return { ok: false, error: "이름을 입력해주세요.", code: "bad_name" };
  }
  if (!PHONE_RE.test(phone)) {
    return { ok: false, error: "유효한 핸드폰 번호를 입력해주세요.", code: "bad_phone" };
  }
  if (![1, 2, 3, 4].includes(bannerSlot)) {
    return { ok: false, error: "배너 번호는 1~4 중 선택해주세요.", code: "bad_slot" };
  }
  if (![30, 60, 90].includes(durationDays)) {
    return { ok: false, error: "노출 기간을 선택해주세요.", code: "bad_duration" };
  }

  return {
    ok: true,
    value: {
      youtubeUrl,
      name,
      phone,
      bannerSlot: bannerSlot as BannerSlot,
      durationDays: durationDays as 30 | 60 | 90,
      message,
    },
  };
}

export function formatPrice(won: number): string {
  return `₩${won.toLocaleString("ko-KR")}`;
}

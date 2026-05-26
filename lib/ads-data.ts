import type { BannerSlot } from "@/lib/inquiry";

export interface AdBanner {
  slot: BannerSlot;
  youtubeUrl: string;
  title: string;
  channel: string;
  expiresAt: string;
}

export const AD_BANNERS: AdBanner[] = [
  // 광고 접수가 확정되면 여기에 채워넣기. 슬롯당 1건.
  // 예시:
  // { slot: 1, youtubeUrl: "https://www.youtube.com/watch?v=XXXX", title: "10분 복근", channel: "핏트레이너", expiresAt: "2026-07-01" },
];

export function youtubeIdFrom(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.pathname.startsWith("/watch")) {
      return u.searchParams.get("v");
    }
    if (u.pathname.startsWith("/shorts/")) {
      return u.pathname.split("/")[2] || null;
    }
    if (u.pathname.startsWith("/embed/")) {
      return u.pathname.split("/")[2] || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function thumbnailFor(url: string): string | null {
  const id = youtubeIdFrom(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

import type { BannerSlot } from "@/lib/inquiry";

export interface AdBanner {
  slot: BannerSlot;
  youtubeUrl: string;
  title: string;
  channel: string;
  expiresAt: string;
}

export const AD_BANNERS: AdBanner[] = [
  // 광고 접수가 확정되면 여기에 채워넣기. 슬롯당 1건. 슬롯 4는 비워둠(문의 유도).
  {
    slot: 1,
    youtubeUrl: "https://youtu.be/CYcLODSeC-c",
    title: "층간소음 없이 딱! 15분 체지방 녹이는 루틴",
    channel: "권혁",
    expiresAt: "2026-12-31",
  },
  {
    slot: 2,
    youtubeUrl: "https://youtu.be/aKzE3NNFEi4",
    title: "하루 한 번! 10분 기본 전신근력 홈트",
    channel: "빵느",
    expiresAt: "2026-12-31",
  },
  {
    slot: 3,
    youtubeUrl: "https://youtube.com/shorts/6IT2wqYhfwo",
    title: "헐리우드48 디톡스로 급찐급빠 다이어트 #shorts",
    channel: "티니데이 Tini day",
    expiresAt: "2026-12-31",
  },
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

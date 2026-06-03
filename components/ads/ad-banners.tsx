import Link from "next/link";
import { Play, Megaphone, ArrowRight } from "lucide-react";
import {
  AD_BANNERS,
  thumbnailFor,
  type AdBanner,
} from "@/lib/ads-data";
import type { BannerSlot } from "@/lib/inquiry";

const SLOTS: BannerSlot[] = [1, 2, 3, 4];

export function AdBanners() {
  const bySlot = new Map<BannerSlot, AdBanner>();
  for (const b of AD_BANNERS) bySlot.set(b.slot, b);

  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-6 pb-16 sm:pt-10 sm:pb-24">
      <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
            Featured
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-4xl tracking-[-0.02em] font-semibold">
            지금 인기 운동 채널
          </h2>
          <p className="mt-2 text-[13px] sm:text-sm text-foreground-muted">
            트레이너·크리에이터의 운동 채널을 만나보세요.
          </p>
        </div>
        <Link
          href="/advertise"
          className="hidden sm:inline-flex items-center gap-1.5 text-[13px] text-foreground-muted hover:text-foreground transition-colors"
        >
          내 채널 노출하기 <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {SLOTS.map((slot) => {
          const ad = bySlot.get(slot);
          return ad ? (
            <FilledSlot key={slot} ad={ad} />
          ) : (
            <EmptySlot key={slot} slot={slot} />
          );
        })}
      </div>
    </section>
  );
}

function FilledSlot({ ad }: { ad: AdBanner }) {
  const thumb = thumbnailFor(ad.youtubeUrl);
  return (
    <a
      href={ad.youtubeUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group card-premium overflow-hidden flex flex-col"
    >
      <div className="relative aspect-video bg-surface-2 overflow-hidden">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={ad.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-2.5 left-2.5 text-[10px] uppercase tracking-[0.15em] px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white/80 border border-white/10">
          Ad
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-12 w-12 rounded-full bg-accent text-black flex items-center justify-center">
            <Play size={20} className="ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <div className="text-[13px] sm:text-[14px] font-medium leading-snug line-clamp-2 text-foreground">
          {ad.title}
        </div>
        <div className="mt-1.5 text-[11px] text-foreground-dim">
          {ad.channel}
        </div>
      </div>
    </a>
  );
}

function EmptySlot({ slot }: { slot: BannerSlot }) {
  return (
    <Link
      href="/advertise"
      className="card-premium flex flex-col items-center justify-center text-center p-5 aspect-video sm:aspect-auto sm:min-h-[220px] hover:border-border-strong transition-all group"
    >
      <div className="h-10 w-10 rounded-2xl bg-surface-2 text-foreground-muted group-hover:text-accent flex items-center justify-center transition-colors">
        <Megaphone size={18} />
      </div>
      <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-foreground-dim">
        배너 {slot}
      </div>
      <div className="mt-1 text-[13px] text-foreground-muted group-hover:text-foreground transition-colors">
        내 채널 노출하기
      </div>
    </Link>
  );
}

"use client";

import { useT } from "@/lib/i18n";

// The page header copy for /community. Split into its own client component so it
// can use the locale-aware translator (the page itself stays a server component
// to keep `export const metadata`).
export function CommunityHero() {
  const t = useT();
  return (
    <section className="mx-auto w-full max-w-5xl px-5 sm:px-8 pt-16 sm:pt-24 pb-8">
      <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
        Community
      </span>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl tracking-[-0.03em] font-semibold">
        {t("나누고, 자랑하세요.", "Share it. Show it off.")}
      </h1>
      <p className="mt-4 text-foreground-muted text-[15px] leading-relaxed max-w-2xl">
        {t(
          "내가 만든 인터벌 루틴을 공유하고, 꾸준히 쌓은 내 운동 기록도 캘린더 그대로 자랑해보세요. 마음에 드는 루틴은 한 번의 클릭으로 내 라이브러리에 가져올 수 있어요.",
          "Share the interval routines you've built, and show off the workout streak you've stacked up — calendar and all. Like a routine? Add it to your library in a single click.",
        )}
      </p>
    </section>
  );
}

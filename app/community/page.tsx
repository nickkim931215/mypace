import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CommunityFeed } from "@/components/community/community-feed";

export const metadata = {
  title: "커뮤니티 — MyPace",
  description: "다른 사람들이 만든 인터벌 루틴을 둘러보고 한 번에 내 라이브러리로 가져오세요.",
};

export default function CommunityPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-5xl px-5 sm:px-8 pt-16 sm:pt-24 pb-8">
          <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
            Community
          </span>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl tracking-[-0.03em] font-semibold">
            나누고, 자랑하세요.
          </h1>
          <p className="mt-4 text-foreground-muted text-[15px] leading-relaxed max-w-2xl">
            내가 만든 인터벌 루틴을 공유하고, 꾸준히 쌓은 내 운동 기록도 캘린더 그대로 자랑해보세요. 마음에 드는 루틴은 한 번의 클릭으로 내 라이브러리에 가져올 수 있어요.
          </p>
        </section>

        <section className="mx-auto w-full max-w-5xl px-5 sm:px-8 pb-24 sm:pb-32">
          <CommunityFeed />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

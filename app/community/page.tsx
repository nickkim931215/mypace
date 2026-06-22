import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CommunityFeed } from "@/components/community/community-feed";
import { CommunityHero } from "@/app/community/community-hero";

export const metadata = {
  title: "커뮤니티 — MyPace",
  description: "다른 사람들이 만든 인터벌 루틴을 둘러보고 한 번에 내 라이브러리로 가져오세요.",
};

export default function CommunityPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <CommunityHero />

        <section className="mx-auto w-full max-w-5xl px-5 sm:px-8 pb-24 sm:pb-32">
          <CommunityFeed />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

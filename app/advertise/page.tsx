import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { InquiryForm } from "@/components/ads/inquiry-form";
import { Megaphone, Users, BarChart3 } from "lucide-react";

export const metadata = {
  title: "광고 문의 — MyPace",
  description:
    "MyPace 홈 배너에 유튜브 운동 영상을 노출하세요. 30·60·90일 옵션.",
};

const HIGHLIGHTS = [
  {
    icon: Megaphone,
    title: "홈 4슬롯 노출",
    desc: "방문자가 가장 먼저 보는 4개 배너 중 한 곳을 차지하세요.",
  },
  {
    icon: Users,
    title: "운동 의향 100%",
    desc: "타이머·AI 추천을 쓰러 온 트래픽 — 운동 콘텐츠 전환율이 높습니다.",
  },
  {
    icon: BarChart3,
    title: "기간 단위 정액",
    desc: "30·60·90일 정액제. 클릭당 과금 없이 안정적 노출.",
  },
];

export default function AdvertisePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-3xl px-5 sm:px-8 pt-20 sm:pt-28 pb-10">
          <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
            Advertise on MyPace
          </span>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl tracking-[-0.03em] font-semibold">
            유튜브 운동 채널을
            <br />
            <span className="text-accent">운동러의 홈 화면</span>에.
          </h1>
          <p className="mt-5 text-foreground-muted text-[15px] leading-relaxed max-w-xl">
            MyPace 홈에는 4개의 배너 슬롯이 있습니다. 트레이너·운동 채널 영상을
            정해진 기간 동안 노출하고, 운동을 막 시작하려는 사용자와 만나세요.
          </p>
        </section>

        <section className="mx-auto w-full max-w-5xl px-5 sm:px-8 pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="card-premium p-5">
                <div className="h-10 w-10 rounded-2xl bg-surface-2 text-accent flex items-center justify-center">
                  <h.icon size={18} />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight">
                  {h.title}
                </h3>
                <p className="mt-1.5 text-[13px] text-foreground-muted leading-relaxed">
                  {h.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-5 sm:px-8 pb-24 sm:pb-32">
          <div className="card-premium p-6 sm:p-8">
            <InquiryForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

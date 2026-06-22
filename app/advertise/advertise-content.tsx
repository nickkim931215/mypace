"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { InquiryForm } from "@/components/ads/inquiry-form";
import { Megaphone, Users, BarChart3 } from "lucide-react";
import { useT, type TranslateFn } from "@/lib/i18n";

function highlights(t: TranslateFn) {
  return [
    {
      icon: Megaphone,
      title: t("홈 4슬롯 노출", "4 home slots"),
      desc: t(
        "방문자가 가장 먼저 보는 4개 배너 중 한 곳을 차지하세요.",
        "Claim one of the first 4 banners every visitor sees.",
      ),
    },
    {
      icon: Users,
      title: t("운동 의향 100%", "100% workout intent"),
      desc: t(
        "타이머·AI 추천을 쓰러 온 트래픽 — 운동 콘텐츠 전환율이 높습니다.",
        "Traffic that came for the timer and AI picks — workout content converts well.",
      ),
    },
    {
      icon: BarChart3,
      title: t("기간 단위 정액", "Flat-rate by period"),
      desc: t(
        "30·60·90일 정액제. 클릭당 과금 없이 안정적 노출.",
        "Flat rate for 30/60/90 days. Steady exposure with no per-click charges.",
      ),
    },
  ];
}

export function AdvertiseContent() {
  const t = useT();
  const HIGHLIGHTS = highlights(t);
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-3xl px-5 sm:px-8 pt-20 sm:pt-28 pb-10">
          <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
            Advertise on MyPace
          </span>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl tracking-[-0.03em] font-semibold">
            {t("유튜브 운동 채널을", "Put your YouTube")}
            <br />
            <span className="text-accent">
              {t("운동러의 홈 화면", "workout channel on their home screen")}
            </span>
            {t("에.", ".")}
          </h1>
          <p className="mt-5 text-foreground-muted text-[15px] leading-relaxed max-w-xl">
            {t(
              "MyPace 홈에는 4개의 배너 슬롯이 있습니다. 트레이너·운동 채널 영상을 정해진 기간 동안 노출하고, 운동을 막 시작하려는 사용자와 만나세요.",
              "The MyPace home has 4 banner slots. Feature your trainer or workout channel video for a set period and reach users who are about to start working out.",
            )}
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

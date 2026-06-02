import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HistoryView } from "@/components/history/history-view";

export const metadata = {
  title: "내 기록 — MyPace",
  description: "날짜별 운동 완료 기록과 연속 스트릭을 한눈에. 나만 볼 수 있어요.",
};

export default function HistoryPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-2xl px-5 sm:px-8 pt-16 sm:pt-24 pb-8">
          <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
            History
          </span>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl tracking-[-0.03em] font-semibold">
            내 운동 기록.
          </h1>
          <p className="mt-4 text-foreground-muted text-[15px] leading-relaxed">
            루틴을 끝까지 완료할 때마다 날짜별로 쌓여요. 연속 기록을 이어가며
            나만의 페이스를 만들어보세요.
          </p>
        </section>

        <section className="mx-auto w-full max-w-2xl px-5 sm:px-8 pb-24 sm:pb-32">
          <HistoryView />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

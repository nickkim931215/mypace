"use client";

import { HistoryView } from "@/components/history/history-view";
import { useT } from "@/lib/i18n";

export function HistoryPageContent() {
  const t = useT();
  return (
    <>
      <section className="mx-auto w-full max-w-2xl px-5 sm:px-8 pt-16 sm:pt-24 pb-8">
        <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
          History
        </span>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl tracking-[-0.03em] font-semibold">
          {t("내 운동 기록.", "My workout history.")}
        </h1>
        <p className="mt-4 text-foreground-muted text-[15px] leading-relaxed">
          {t(
            "루틴을 끝까지 완료할 때마다 날짜별로 쌓여요. 연속 기록을 이어가며 나만의 페이스를 만들어보세요.",
            "Every routine you finish gets logged by date. Keep your streak going and build your own pace.",
          )}
        </p>
      </section>

      <section className="mx-auto w-full max-w-2xl px-5 sm:px-8 pb-24 sm:pb-32">
        <HistoryView />
      </section>
    </>
  );
}

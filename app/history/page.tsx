import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HistoryPageContent } from "./history-page-client";

export const metadata = {
  title: "내 기록 — MyPace",
  description: "날짜별 운동 완료 기록과 연속 스트릭을 한눈에. 나만 볼 수 있어요.",
};

export default function HistoryPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <HistoryPageContent />
      </main>
      <SiteFooter />
    </>
  );
}

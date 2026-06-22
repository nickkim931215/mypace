import type { Metadata } from "next";
import TermsContent from "./terms-content";

export const metadata: Metadata = {
  title: "이용약관 · 커뮤니티 가이드라인 — MyPace",
  description:
    "MyPace 서비스 이용약관과 커뮤니티 가이드라인 — 금지되는 콘텐츠, 신고 및 차단, 건강·안전 안내를 담고 있습니다.",
};

export default function TermsPage() {
  return <TermsContent />;
}

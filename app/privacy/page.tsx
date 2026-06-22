import type { Metadata } from "next";
import PrivacyContent from "./privacy-content";

export const metadata: Metadata = {
  title: "개인정보처리방침 — MyPace",
  description:
    "MyPace가 수집하는 개인정보 항목, 이용 목적, 보관 및 파기, 제3자 처리, 이용자 권리를 안내합니다.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}

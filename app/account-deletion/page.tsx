import type { Metadata } from "next";
import AccountDeletionContent from "./account-deletion-content";

export const metadata: Metadata = {
  title: "계정 및 데이터 삭제 — MyPace",
  description:
    "MyPace 계정과 데이터를 삭제하는 방법, 삭제되는 항목, 보관 정책을 안내합니다.",
};

export default function AccountDeletionPage() {
  return <AccountDeletionContent />;
}

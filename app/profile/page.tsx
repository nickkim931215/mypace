import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProfilePageContent } from "./profile-page-client";

export const metadata = {
  title: "내 프로필 — MyPace",
  description: "커뮤니티에 표시되는 닉네임을 설정하세요.",
};

export default function ProfilePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <ProfilePageContent />
      </main>
      <SiteFooter />
    </>
  );
}

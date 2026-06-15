import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PublicProfile } from "@/components/profile/public-profile";

export const metadata = {
  title: "프로필 — MyPace",
  description: "커뮤니티 사용자 프로필.",
};

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-2xl px-5 sm:px-8 pt-16 sm:pt-24 pb-24 sm:pb-32">
          <PublicProfile uid={uid} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

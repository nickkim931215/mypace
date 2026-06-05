import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProfileEditor } from "@/components/profile/profile-editor";

export const metadata = {
  title: "내 프로필 — MyPace",
  description: "커뮤니티에 표시되는 닉네임을 설정하세요.",
};

export default function ProfilePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-2xl px-5 sm:px-8 pt-16 sm:pt-24 pb-8">
          <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
            Profile
          </span>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl tracking-[-0.03em] font-semibold">
            내 프로필.
          </h1>
          <p className="mt-4 text-foreground-muted text-[15px] leading-relaxed">
            커뮤니티에 표시되는 닉네임을 정해보세요. 닉네임은 중복될 수 없어요.
          </p>
        </section>

        <section className="mx-auto w-full max-w-2xl px-5 sm:px-8 pb-24 sm:pb-32">
          <ProfileEditor />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

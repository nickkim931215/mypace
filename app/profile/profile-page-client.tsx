"use client";

import { ProfileEditor } from "@/components/profile/profile-editor";
import { useT } from "@/lib/i18n";

export function ProfilePageContent() {
  const t = useT();
  return (
    <>
      <section className="mx-auto w-full max-w-2xl px-5 sm:px-8 pt-16 sm:pt-24 pb-8">
        <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
          Profile
        </span>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl tracking-[-0.03em] font-semibold">
          {t("내 프로필.", "My profile.")}
        </h1>
        <p className="mt-4 text-foreground-muted text-[15px] leading-relaxed">
          {t(
            "커뮤니티에 표시되는 닉네임·연령대·성별을 설정하세요. 닉네임은 중복될 수 없어요.",
            "Set the nickname, age range, and gender shown in the community. Nicknames must be unique.",
          )}
        </p>
      </section>

      <section className="mx-auto w-full max-w-2xl px-5 sm:px-8 pb-24 sm:pb-32">
        <ProfileEditor />
      </section>
    </>
  );
}

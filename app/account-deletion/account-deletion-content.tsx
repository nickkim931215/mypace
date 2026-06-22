"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

const ADMIN_EMAIL = "nickkim931215@gmail.com";

export default function AccountDeletionContent() {
  const t = useT();

  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
        MyPace
      </span>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
        {t("계정 및 데이터 삭제", "Account and Data Deletion")}
      </h1>
      <p className="mt-3 text-[14px] text-foreground-muted leading-relaxed">
        {t(
          "MyPace(마이페이스) 앱의 계정과 연결된 데이터를 삭제하는 방법을 안내합니다.",
          "This page explains how to delete your MyPace account and the data associated with it.",
        )}
      </p>

      <section className="mt-9">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {t("앱에서 직접 삭제하기", "Delete it yourself in the app")}
        </h2>
        <ol className="mt-3 flex flex-col gap-2 text-[14px] text-foreground-muted leading-relaxed list-decimal pl-5">
          <li>{t("MyPace 앱에 로그인합니다.", "Sign in to the MyPace app.")}</li>
          <li>
            {t("", "Go to the ")}
            <span className="text-foreground font-medium">
              {t("내 프로필", "My Profile")}
            </span>{" "}
            {t("화면으로 이동합니다.", "screen.")}
          </li>
          <li>
            {t("맨 아래 ", "At the very bottom, tap ")}
            <span className="text-foreground font-medium">
              {t("계정 삭제", "Delete account")}
            </span>
            {t(
              "를 눌러 안내에 따라 영구 삭제합니다.",
              " and follow the prompts to permanently delete it.",
            )}
          </li>
        </ol>
      </section>

      <section className="mt-9">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {t("이메일로 요청하기", "Request deletion by email")}
        </h2>
        <p className="mt-3 text-[14px] text-foreground-muted leading-relaxed">
          {t(
            "앱에 접근할 수 없는 경우, 가입에 사용한 이메일 주소로 아래로 삭제를 요청해 주세요. 본인 확인 후 처리해 드립니다.",
            "If you cannot access the app, please request deletion at the address below from the email address you used to sign up. We will process it after verifying your identity.",
          )}
        </p>
        <a
          href={`mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(
            t("MyPace 계정 삭제 요청", "MyPace account deletion request"),
          )}`}
          className="mt-3 inline-block text-[14px] text-accent underline underline-offset-2"
        >
          {ADMIN_EMAIL}
        </a>
      </section>

      <section className="mt-9">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {t("삭제되는 데이터", "Data that is deleted")}
        </h2>
        <ul className="mt-3 flex flex-col gap-1.5 text-[14px] text-foreground-muted leading-relaxed list-disc pl-5">
          <li>{t("계정(로그인) 정보 및 이메일", "Account (sign-in) information and email")}</li>
          <li>{t("프로필과 닉네임", "Profile and nickname")}</li>
          <li>{t("운동 기록 및 저장한 루틴", "Workout records and saved routines")}</li>
          <li>{t("커뮤니티에 작성한 게시물", "Posts you created in the community")}</li>
          <li>{t("팔로우 관계 및 알림", "Follow relationships and notifications")}</li>
        </ul>
        <p className="mt-3 text-[13px] text-foreground-dim leading-relaxed">
          {t(
            "계정 삭제는 즉시 처리되며 되돌릴 수 없습니다. 다른 사용자의 게시물에 남긴 댓글 등 일부 커뮤니티 활동은 익명화된 형태로 남을 수 있으며, 전체 삭제를 원하시면 위 이메일로 요청해 주세요. 시스템 백업에 포함된 데이터는 최대 30일 이내에 영구 삭제됩니다.",
            "Account deletion is processed immediately and cannot be undone. Some community activity, such as comments you left on other users' posts, may remain in anonymized form; if you want it fully removed, please request it at the email above. Data contained in system backups is permanently deleted within a maximum of 30 days.",
          )}
        </p>
      </section>

      <div className="mt-12 border-t border-border-subtle pt-6">
        <Link
          href="/"
          className="text-[13px] text-foreground-dim hover:text-foreground underline underline-offset-2"
        >
          {t("← MyPace 홈으로", "← Back to MyPace home")}
        </Link>
      </div>
    </main>
  );
}

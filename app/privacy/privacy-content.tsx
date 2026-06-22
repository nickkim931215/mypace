"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

const ADMIN_EMAIL = "nickkim931215@gmail.com";

export default function PrivacyContent() {
  const t = useT();
  const EFFECTIVE_DATE = t("2026년 6월 11일", "June 11, 2026");

  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
        MyPace
      </span>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
        {t("개인정보처리방침", "Privacy Policy")}
      </h1>
      <p className="mt-3 text-[13px] text-foreground-dim">
        {t("시행일:", "Effective date:")} {EFFECTIVE_DATE}
      </p>
      <p className="mt-4 text-[14px] text-foreground-muted leading-relaxed">
        {t(
          "MyPace(마이페이스, 이하 “서비스”)는 이용자의 개인정보를 중요하게 생각하며, 아래와 같이 수집·이용·보관합니다.",
          "MyPace (hereinafter the “Service”) values your personal information and collects, uses, and stores it as described below.",
        )}
      </p>

      <Section
        title={t(
          "1. 수집하는 개인정보 항목",
          "1. Personal Information We Collect",
        )}
      >
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>
            <b className="text-foreground">{t("계정 정보", "Account information")}</b>{" "}
            {t(
              "— Google 로그인 시 이메일 주소, 이름, 프로필 사진(Google이 제공하는 범위)",
              "— your email address, name, and profile picture provided by Google when you sign in with Google",
            )}
          </li>
          <li>
            <b className="text-foreground">{t("프로필", "Profile")}</b>{" "}
            {t(
              "— 이용자가 설정한 닉네임, 프로필 사진",
              "— the nickname and profile picture you set",
            )}
          </li>
          <li>
            <b className="text-foreground">
              {t("서비스 이용 데이터", "Service usage data")}
            </b>{" "}
            {t(
              "— 운동 기록, 저장한 루틴, 운동 레벨",
              "— workout records, saved routines, and workout level",
            )}
          </li>
          <li>
            <b className="text-foreground">{t("커뮤니티 활동", "Community activity")}</b>{" "}
            {t(
              "— 게시물, 댓글, 좋아요, 팔로우 관계, 알림",
              "— posts, comments, likes, follow relationships, and notifications",
            )}
          </li>
          <li>
            <b className="text-foreground">{t("AI 추천 입력값", "AI recommendation inputs")}</b>{" "}
            {t(
              "— 운동 부위, 강도, 시간, 장비 등 추천 요청 정보",
              "— recommendation request details such as target body area, intensity, duration, and equipment",
            )}
          </li>
        </ul>
        <p className="mt-2 text-[13px] text-foreground-dim">
          {t(
            "별도의 결제 정보나 위치 정보, 연락처는 수집하지 않습니다.",
            "We do not collect any payment information, location data, or contacts.",
          )}
        </p>
      </Section>

      <Section
        title={t(
          "2. 개인정보의 이용 목적",
          "2. How We Use Personal Information",
        )}
      >
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>
            {t(
              "로그인 및 기기 간 운동 기록·루틴 동기화",
              "Sign-in and syncing of workout records and routines across devices",
            )}
          </li>
          <li>
            {t(
              "커뮤니티 기능 제공 및 닉네임·프로필 표시",
              "Providing community features and displaying nicknames and profiles",
            )}
          </li>
          <li>
            {t(
              "AI 운동 루틴 추천 제공",
              "Providing AI workout routine recommendations",
            )}
          </li>
          <li>
            {t(
              "서비스 운영, 오류 대응, 부정 이용 방지",
              "Operating the Service, addressing errors, and preventing abuse",
            )}
          </li>
        </ul>
      </Section>

      <Section
        title={t("3. 제3자 처리 위탁", "3. Third-Party Processors")}
      >
        <p>
          {t(
            "서비스 제공을 위해 아래 사업자에 개인정보 처리를 위탁합니다. 각 사는 자체 보안 및 개인정보 보호 정책을 따릅니다.",
            "To provide the Service, we entrust the processing of personal information to the providers below. Each provider follows its own security and privacy policies.",
          )}
        </p>
        <ul className="mt-2 list-disc pl-5 flex flex-col gap-1.5">
          <li>
            <b className="text-foreground">Google Firebase</b>{" "}
            {t(
              "— 인증, 데이터베이스(운동 기록·프로필·커뮤니티 저장)",
              "— authentication and database (storing workout records, profiles, and community data)",
            )}
          </li>
          <li>
            <b className="text-foreground">Vercel</b>{" "}
            {t("— 웹/앱 호스팅", "— web/app hosting")}
          </li>
          <li>
            <b className="text-foreground">Google Gemini API</b>{" "}
            {t(
              "— AI 운동 추천 처리(추천 입력값 전송)",
              "— processing AI workout recommendations (recommendation inputs are sent)",
            )}
          </li>
        </ul>
      </Section>

      <Section title={t("4. 공개되는 정보", "4. Information Made Public")}>
        <p>
          {t(
            "닉네임, 프로필 사진, 커뮤니티에 작성한 게시물·댓글·좋아요와 운동 레벨은 로그인한 다른 이용자에게 공개됩니다. 운동 기록 등 개인 데이터는 이용자가 직접 공유하기 전까지 비공개입니다.",
            "Your nickname, profile picture, the posts, comments, and likes you create in the community, and your workout level are visible to other signed-in users. Personal data such as your workout records remains private until you choose to share it.",
          )}
        </p>
      </Section>

      <Section
        title={t("5. 보관 및 파기", "5. Retention and Deletion")}
      >
        <p>
          {t(
            "개인정보는 회원 탈퇴(계정 삭제) 시 지체 없이 파기합니다. 시스템 백업에 포함된 데이터는 최대 30일 이내에 영구 삭제됩니다. 계정 삭제 방법과 삭제되는 항목은 아래 페이지에서 확인할 수 있습니다.",
            "Your personal information is destroyed without delay when you withdraw from membership (delete your account). Data contained in system backups is permanently deleted within a maximum of 30 days. You can find how to delete your account and which items are deleted on the page below.",
          )}
        </p>
        <Link
          href="/account-deletion"
          className="mt-2 inline-block text-[14px] text-accent underline underline-offset-2"
        >
          {t("계정 및 데이터 삭제 안내 →", "Account and data deletion guide →")}
        </Link>
      </Section>

      <Section title={t("6. 이용자의 권리", "6. Your Rights")}>
        <p>
          {t(
            "이용자는 언제든지 자신의 개인정보를 조회·수정(프로필 화면)하거나 계정을 삭제할 수 있습니다. 기타 개인정보 관련 문의는 아래로 연락해 주세요.",
            "You may view and edit your personal information (on the profile screen) or delete your account at any time. For any other privacy-related questions, please contact us below.",
          )}
        </p>
      </Section>

      <Section
        title={t("7. 아동의 개인정보", "7. Children's Personal Information")}
      >
        <p>
          {t(
            "본 서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 아동의 개인정보를 고의로 수집하지 않습니다.",
            "This Service is not directed at children under the age of 14, and we do not knowingly collect children's personal information.",
          )}
        </p>
      </Section>

      <Section title={t("8. 문의처", "8. Contact")}>
        <a
          href={`mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(
            t("MyPace 개인정보 문의", "MyPace privacy inquiry"),
          )}`}
          className="text-[14px] text-accent underline underline-offset-2"
        >
          {ADMIN_EMAIL}
        </a>
      </Section>

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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9">
      <h2 className="font-display text-lg font-semibold tracking-tight">
        {title}
      </h2>
      <div className="mt-3 text-[14px] text-foreground-muted leading-relaxed">
        {children}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

const ADMIN_EMAIL = "nickkim931215@gmail.com";

export default function TermsContent() {
  const t = useT();
  const EFFECTIVE_DATE = t("2026년 6월 16일", "June 16, 2026");

  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
        MyPace
      </span>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
        {t(
          "이용약관 · 커뮤니티 가이드라인",
          "Terms of Service · Community Guidelines",
        )}
      </h1>
      <p className="mt-3 text-[13px] text-foreground-dim">
        {t("시행일:", "Effective date:")} {EFFECTIVE_DATE}
      </p>
      <p className="mt-4 text-[14px] text-foreground-muted leading-relaxed">
        {t(
          "MyPace(마이페이스, 이하 “서비스”)를 이용함으로써 본 약관과 커뮤니티 가이드라인에 동의하게 됩니다. 서비스를 이용하기 전에 아래 내용을 읽어 주세요.",
          "By using MyPace (hereinafter the “Service”), you agree to these Terms and the Community Guidelines. Please read the following before using the Service.",
        )}
      </p>

      <Section title={t("1. 서비스 내용", "1. About the Service")}>
        <p>
          {t(
            "서비스는 인터벌 운동 타이머, 메트로놈, AI 루틴 추천, 운동 기록, 그리고 이용자들이 루틴과 운동 기록을 공유하는 커뮤니티 기능을 무료로 제공합니다. 운영자는 서비스의 내용을 사전 고지 후 변경하거나 중단할 수 있습니다.",
            "The Service provides, free of charge, an interval workout timer, a metronome, AI routine recommendations, workout logging, and community features that let users share routines and workout records. The operator may change or discontinue the Service after giving prior notice.",
          )}
        </p>
      </Section>

      <Section title={t("2. 계정", "2. Accounts")}>
        <p>
          {t(
            "서비스는 Google 계정으로 로그인합니다. 이용자는 자신의 계정과 닉네임으로 이루어지는 모든 활동에 책임을 집니다. 이용자는 언제든지 프로필 화면에서 계정을 삭제할 수 있습니다.",
            "You sign in to the Service with a Google account. You are responsible for all activity carried out under your account and nickname. You may delete your account at any time from the profile screen.",
          )}
        </p>
        <Link
          href="/account-deletion"
          className="mt-2 inline-block text-[14px] text-accent underline underline-offset-2"
        >
          {t("계정 및 데이터 삭제 안내 →", "Account and data deletion guide →")}
        </Link>
      </Section>

      <Section
        title={t("3. 이용자가 작성한 콘텐츠", "3. User-Generated Content")}
      >
        <p>
          {t(
            "이용자가 작성한 게시물·댓글·닉네임 등(이하 “콘텐츠”)의 저작권은 작성자에게 있습니다. 이용자는 서비스가 해당 콘텐츠를 다른 이용자에게 표시·전송하는 데 필요한 범위에서 이를 이용할 수 있도록 허락합니다. 콘텐츠에 대한 책임은 전적으로 작성자에게 있으며, 운영자는 이용자가 작성한 콘텐츠의 정확성이나 적법성을 보증하지 않습니다.",
            "Copyright in the posts, comments, nicknames, and other materials you create (hereinafter “Content”) belongs to the author. You grant the Service permission to use that Content to the extent necessary to display and transmit it to other users. You are solely responsible for your Content, and the operator does not guarantee the accuracy or legality of Content created by users.",
          )}
        </p>
      </Section>

      <Section
        title={t(
          "4. 커뮤니티 가이드라인 — 금지되는 콘텐츠",
          "4. Community Guidelines — Prohibited Content",
        )}
      >
        <p>
          {t(
            "모두가 안전하게 운동을 나누는 공간을 위해, 다음과 같은 콘텐츠와 행위는 금지됩니다.",
            "To keep this a safe space where everyone can share their workouts, the following content and conduct are prohibited.",
          )}
        </p>
        <ul className="mt-3 list-disc pl-5 flex flex-col gap-2">
          <li>
            <b className="text-foreground">{t("스팸 · 광고", "Spam · Advertising")}</b>{" "}
            {t(
              "— 반복 도배, 무관한 홍보, 사기성 링크",
              "— repetitive flooding, irrelevant promotion, fraudulent links",
            )}
          </li>
          <li>
            <b className="text-foreground">
              {t("괴롭힘 · 혐오 발언", "Harassment · Hate speech")}
            </b>{" "}
            {t(
              "— 특정 개인이나 집단을 향한 모욕, 차별, 위협, 따돌림",
              "— insults, discrimination, threats, or bullying aimed at a specific individual or group",
            )}
          </li>
          <li>
            <b className="text-foreground">
              {t("음란물 · 선정성", "Obscenity · Sexual content")}
            </b>{" "}
            {t(
              "— 성적으로 노골적인 이미지나 문구",
              "— sexually explicit images or text",
            )}
          </li>
          <li>
            <b className="text-foreground">
              {t("폭력 · 위험한 행동", "Violence · Dangerous behavior")}
            </b>{" "}
            {t(
              "— 폭력 조장, 자해, 극단적 단식이나 위험한 다이어트 등 신체에 해를 끼치는 행위를 권장하는 내용",
              "— content that promotes violence, self-harm, extreme fasting, dangerous dieting, or other conduct harmful to the body",
            )}
          </li>
          <li>
            <b className="text-foreground">{t("허위 정보", "Misinformation")}</b>{" "}
            {t(
              "— 사실을 왜곡하거나 타인을 기만하는 내용",
              "— content that distorts facts or deceives others",
            )}
          </li>
          <li>
            <b className="text-foreground">
              {t("사칭 · 개인정보 침해", "Impersonation · Privacy violations")}
            </b>{" "}
            {t(
              "— 타인 사칭, 동의 없는 개인정보·연락처 공개",
              "— impersonating others, or disclosing personal information or contacts without consent",
            )}
          </li>
          <li>
            <b className="text-foreground">
              {t("불법 · 권리 침해", "Illegal · Infringing content")}
            </b>{" "}
            {t(
              "— 법령 위반, 저작권·상표권 침해 콘텐츠",
              "— content that violates the law or infringes copyrights or trademarks",
            )}
          </li>
        </ul>
      </Section>

      <Section
        title={t("5. 신고 및 운영자 조치", "5. Reporting and Operator Action")}
      >
        <p>
          {t("이용자는 게시물·댓글·프로필의 ", "You can report content that violates the guidelines using the ")}
          <b className="text-foreground">⋯</b>
          {t(
            " 또는 신고 버튼으로 가이드라인을 위반하는 콘텐츠를 신고할 수 있고, 특정 사용자를 ",
            " menu or the report button on a post, comment, or profile, and if you ",
          )}
          <b className="text-foreground">{t("차단", "block")}</b>
          {t(
            "하면 그 사용자의 게시물과 댓글이 더 이상 보이지 않습니다. 운영자는 신고를 검토하여 가이드라인을 위반하는 콘텐츠를 삭제하거나, 반복·중대한 위반 계정의 이용을 제한·정지할 수 있습니다.",
            " a specific user, that user's posts and comments will no longer be shown to you. The operator reviews reports and may remove content that violates the guidelines, or restrict or suspend accounts responsible for repeated or serious violations.",
          )}
        </p>
      </Section>

      <Section
        title={t("6. 건강 및 안전 고지", "6. Health and Safety Notice")}
      >
        <p>
          {t(
            "서비스가 제공하는 타이머·루틴·AI 추천은 일반적인 운동 보조 정보일 뿐, 의학적 조언이나 진단·치료를 대신하지 않습니다. 운동은 본인의 신체 상태에 맞게 이용자의 책임 하에 수행해야 하며, 건강에 우려가 있거나 새로운 운동을 시작하기 전에는 의료 전문가와 상담하시기 바랍니다. 운영자는 서비스 이용 중 발생한 부상이나 건강상의 문제에 대해 책임을 지지 않습니다.",
            "The timers, routines, and AI recommendations provided by the Service are general fitness-support information only and are not a substitute for medical advice, diagnosis, or treatment. You should exercise at your own responsibility and in line with your own physical condition, and you should consult a medical professional if you have any health concerns or before starting a new exercise program. The operator is not responsible for any injury or health problem arising from use of the Service.",
          )}
        </p>
      </Section>

      <Section title={t("7. 책임의 한계", "7. Limitation of Liability")}>
        <p>
          {t(
            "서비스는 “있는 그대로” 제공되며, 운영자는 서비스의 무중단성, 오류 없음, 특정 목적에의 적합성을 보증하지 않습니다. 관련 법령이 허용하는 범위에서, 운영자는 서비스 이용으로 발생한 간접적·부수적 손해에 대해 책임을 지지 않습니다.",
            "The Service is provided “as is,” and the operator does not warrant that it will be uninterrupted, error-free, or fit for any particular purpose. To the extent permitted by applicable law, the operator is not liable for any indirect or incidental damages arising from use of the Service.",
          )}
        </p>
      </Section>

      <Section title={t("8. 약관의 변경", "8. Changes to These Terms")}>
        <p>
          {t(
            "운영자는 필요한 경우 본 약관과 가이드라인을 개정할 수 있으며, 변경 시 본 페이지의 시행일을 갱신합니다. 변경 이후에도 서비스를 계속 이용하면 변경된 약관에 동의한 것으로 간주됩니다.",
            "The operator may revise these Terms and Guidelines as needed and will update the effective date on this page when changes are made. If you continue using the Service after a change, you are deemed to have agreed to the revised Terms.",
          )}
        </p>
      </Section>

      <Section title={t("9. 문의처", "9. Contact")}>
        <a
          href={`mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(
            t("MyPace 이용약관 문의", "MyPace Terms of Service inquiry"),
          )}`}
          className="text-[14px] text-accent underline underline-offset-2"
        >
          {ADMIN_EMAIL}
        </a>
      </Section>

      <div className="mt-12 border-t border-border-subtle pt-6 flex items-center gap-5">
        <Link
          href="/"
          className="text-[13px] text-foreground-dim hover:text-foreground underline underline-offset-2"
        >
          {t("← MyPace 홈으로", "← Back to MyPace home")}
        </Link>
        <Link
          href="/privacy"
          className="text-[13px] text-foreground-dim hover:text-foreground underline underline-offset-2"
        >
          {t("개인정보처리방침", "Privacy Policy")}
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

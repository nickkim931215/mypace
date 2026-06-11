import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 — MyPace",
  description:
    "MyPace가 수집하는 개인정보 항목, 이용 목적, 보관 및 파기, 제3자 처리, 이용자 권리를 안내합니다.",
};

const ADMIN_EMAIL = "nickkim931215@gmail.com";
const EFFECTIVE_DATE = "2026년 6월 11일";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
        MyPace
      </span>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
        개인정보처리방침
      </h1>
      <p className="mt-3 text-[13px] text-foreground-dim">
        시행일: {EFFECTIVE_DATE}
      </p>
      <p className="mt-4 text-[14px] text-foreground-muted leading-relaxed">
        MyPace(마이페이스, 이하 &ldquo;서비스&rdquo;)는 이용자의 개인정보를
        중요하게 생각하며, 아래와 같이 수집·이용·보관합니다.
      </p>

      <Section title="1. 수집하는 개인정보 항목">
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>
            <b className="text-foreground">계정 정보</b> — Google 로그인 시
            이메일 주소, 이름, 프로필 사진(Google이 제공하는 범위)
          </li>
          <li>
            <b className="text-foreground">프로필</b> — 이용자가 설정한 닉네임,
            프로필 사진
          </li>
          <li>
            <b className="text-foreground">서비스 이용 데이터</b> — 운동 기록,
            저장한 루틴, 운동 레벨
          </li>
          <li>
            <b className="text-foreground">커뮤니티 활동</b> — 게시물, 댓글,
            좋아요, 팔로우 관계, 알림
          </li>
          <li>
            <b className="text-foreground">AI 추천 입력값</b> — 운동 부위, 강도,
            시간, 장비 등 추천 요청 정보
          </li>
        </ul>
        <p className="mt-2 text-[13px] text-foreground-dim">
          별도의 결제 정보나 위치 정보, 연락처는 수집하지 않습니다.
        </p>
      </Section>

      <Section title="2. 개인정보의 이용 목적">
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>로그인 및 기기 간 운동 기록·루틴 동기화</li>
          <li>커뮤니티 기능 제공 및 닉네임·프로필 표시</li>
          <li>AI 운동 루틴 추천 제공</li>
          <li>서비스 운영, 오류 대응, 부정 이용 방지</li>
        </ul>
      </Section>

      <Section title="3. 제3자 처리 위탁">
        <p>
          서비스 제공을 위해 아래 사업자에 개인정보 처리를 위탁합니다. 각 사는
          자체 보안 및 개인정보 보호 정책을 따릅니다.
        </p>
        <ul className="mt-2 list-disc pl-5 flex flex-col gap-1.5">
          <li>
            <b className="text-foreground">Google Firebase</b> — 인증, 데이터베이스(운동
            기록·프로필·커뮤니티 저장)
          </li>
          <li>
            <b className="text-foreground">Vercel</b> — 웹/앱 호스팅
          </li>
          <li>
            <b className="text-foreground">Google Gemini API</b> — AI 운동 추천
            처리(추천 입력값 전송)
          </li>
        </ul>
      </Section>

      <Section title="4. 공개되는 정보">
        <p>
          닉네임, 프로필 사진, 커뮤니티에 작성한 게시물·댓글·좋아요와 운동 레벨은
          로그인한 다른 이용자에게 공개됩니다. 운동 기록 등 개인 데이터는
          이용자가 직접 공유하기 전까지 비공개입니다.
        </p>
      </Section>

      <Section title="5. 보관 및 파기">
        <p>
          개인정보는 회원 탈퇴(계정 삭제) 시 지체 없이 파기합니다. 시스템 백업에
          포함된 데이터는 최대 30일 이내에 영구 삭제됩니다. 계정 삭제 방법과
          삭제되는 항목은 아래 페이지에서 확인할 수 있습니다.
        </p>
        <Link
          href="/account-deletion"
          className="mt-2 inline-block text-[14px] text-accent underline underline-offset-2"
        >
          계정 및 데이터 삭제 안내 →
        </Link>
      </Section>

      <Section title="6. 이용자의 권리">
        <p>
          이용자는 언제든지 자신의 개인정보를 조회·수정(프로필 화면)하거나 계정을
          삭제할 수 있습니다. 기타 개인정보 관련 문의는 아래로 연락해 주세요.
        </p>
      </Section>

      <Section title="7. 아동의 개인정보">
        <p>
          본 서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 아동의 개인정보를
          고의로 수집하지 않습니다.
        </p>
      </Section>

      <Section title="8. 문의처">
        <a
          href={`mailto:${ADMIN_EMAIL}?subject=MyPace 개인정보 문의`}
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
          ← MyPace 홈으로
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

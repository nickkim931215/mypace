import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관 · 커뮤니티 가이드라인 — MyPace",
  description:
    "MyPace 서비스 이용약관과 커뮤니티 가이드라인 — 금지되는 콘텐츠, 신고 및 차단, 건강·안전 안내를 담고 있습니다.",
};

const ADMIN_EMAIL = "nickkim931215@gmail.com";
const EFFECTIVE_DATE = "2026년 6월 16일";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
        MyPace
      </span>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
        이용약관 · 커뮤니티 가이드라인
      </h1>
      <p className="mt-3 text-[13px] text-foreground-dim">
        시행일: {EFFECTIVE_DATE}
      </p>
      <p className="mt-4 text-[14px] text-foreground-muted leading-relaxed">
        MyPace(마이페이스, 이하 &ldquo;서비스&rdquo;)를 이용함으로써 본 약관과
        커뮤니티 가이드라인에 동의하게 됩니다. 서비스를 이용하기 전에 아래 내용을
        읽어 주세요.
      </p>

      <Section title="1. 서비스 내용">
        <p>
          서비스는 인터벌 운동 타이머, 메트로놈, AI 루틴 추천, 운동 기록, 그리고
          이용자들이 루틴과 운동 기록을 공유하는 커뮤니티 기능을 무료로
          제공합니다. 운영자는 서비스의 내용을 사전 고지 후 변경하거나 중단할 수
          있습니다.
        </p>
      </Section>

      <Section title="2. 계정">
        <p>
          서비스는 Google 계정으로 로그인합니다. 이용자는 자신의 계정과 닉네임으로
          이루어지는 모든 활동에 책임을 집니다. 이용자는 언제든지 프로필 화면에서
          계정을 삭제할 수 있습니다.
        </p>
        <Link
          href="/account-deletion"
          className="mt-2 inline-block text-[14px] text-accent underline underline-offset-2"
        >
          계정 및 데이터 삭제 안내 →
        </Link>
      </Section>

      <Section title="3. 이용자가 작성한 콘텐츠">
        <p>
          이용자가 작성한 게시물·댓글·닉네임 등(이하 &ldquo;콘텐츠&rdquo;)의
          저작권은 작성자에게 있습니다. 이용자는 서비스가 해당 콘텐츠를 다른
          이용자에게 표시·전송하는 데 필요한 범위에서 이를 이용할 수 있도록
          허락합니다. 콘텐츠에 대한 책임은 전적으로 작성자에게 있으며, 운영자는
          이용자가 작성한 콘텐츠의 정확성이나 적법성을 보증하지 않습니다.
        </p>
      </Section>

      <Section title="4. 커뮤니티 가이드라인 — 금지되는 콘텐츠">
        <p>
          모두가 안전하게 운동을 나누는 공간을 위해, 다음과 같은 콘텐츠와 행위는
          금지됩니다.
        </p>
        <ul className="mt-3 list-disc pl-5 flex flex-col gap-2">
          <li>
            <b className="text-foreground">스팸 · 광고</b> — 반복 도배, 무관한
            홍보, 사기성 링크
          </li>
          <li>
            <b className="text-foreground">괴롭힘 · 혐오 발언</b> — 특정 개인이나
            집단을 향한 모욕, 차별, 위협, 따돌림
          </li>
          <li>
            <b className="text-foreground">음란물 · 선정성</b> — 성적으로 노골적인
            이미지나 문구
          </li>
          <li>
            <b className="text-foreground">폭력 · 위험한 행동</b> — 폭력 조장, 자해,
            극단적 단식이나 위험한 다이어트 등 신체에 해를 끼치는 행위를 권장하는
            내용
          </li>
          <li>
            <b className="text-foreground">허위 정보</b> — 사실을 왜곡하거나 타인을
            기만하는 내용
          </li>
          <li>
            <b className="text-foreground">사칭 · 개인정보 침해</b> — 타인 사칭,
            동의 없는 개인정보·연락처 공개
          </li>
          <li>
            <b className="text-foreground">불법 · 권리 침해</b> — 법령 위반,
            저작권·상표권 침해 콘텐츠
          </li>
        </ul>
      </Section>

      <Section title="5. 신고 및 운영자 조치">
        <p>
          이용자는 게시물·댓글·프로필의 <b className="text-foreground">⋯</b> 또는
          신고 버튼으로 가이드라인을 위반하는 콘텐츠를 신고할 수 있고, 특정
          사용자를 <b className="text-foreground">차단</b>하면 그 사용자의
          게시물과 댓글이 더 이상 보이지 않습니다. 운영자는 신고를 검토하여
          가이드라인을 위반하는 콘텐츠를 삭제하거나, 반복·중대한 위반 계정의
          이용을 제한·정지할 수 있습니다.
        </p>
      </Section>

      <Section title="6. 건강 및 안전 고지">
        <p>
          서비스가 제공하는 타이머·루틴·AI 추천은 일반적인 운동 보조 정보일 뿐,
          의학적 조언이나 진단·치료를 대신하지 않습니다. 운동은 본인의 신체 상태에
          맞게 이용자의 책임 하에 수행해야 하며, 건강에 우려가 있거나 새로운 운동을
          시작하기 전에는 의료 전문가와 상담하시기 바랍니다. 운영자는 서비스 이용
          중 발생한 부상이나 건강상의 문제에 대해 책임을 지지 않습니다.
        </p>
      </Section>

      <Section title="7. 책임의 한계">
        <p>
          서비스는 &ldquo;있는 그대로&rdquo; 제공되며, 운영자는 서비스의 무중단성,
          오류 없음, 특정 목적에의 적합성을 보증하지 않습니다. 관련 법령이 허용하는
          범위에서, 운영자는 서비스 이용으로 발생한 간접적·부수적 손해에 대해
          책임을 지지 않습니다.
        </p>
      </Section>

      <Section title="8. 약관의 변경">
        <p>
          운영자는 필요한 경우 본 약관과 가이드라인을 개정할 수 있으며, 변경 시 본
          페이지의 시행일을 갱신합니다. 변경 이후에도 서비스를 계속 이용하면 변경된
          약관에 동의한 것으로 간주됩니다.
        </p>
      </Section>

      <Section title="9. 문의처">
        <a
          href={`mailto:${ADMIN_EMAIL}?subject=MyPace 이용약관 문의`}
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
          ← MyPace 홈으로
        </Link>
        <Link
          href="/privacy"
          className="text-[13px] text-foreground-dim hover:text-foreground underline underline-offset-2"
        >
          개인정보처리방침
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

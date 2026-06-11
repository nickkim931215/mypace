import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "계정 및 데이터 삭제 — MyPace",
  description:
    "MyPace 계정과 데이터를 삭제하는 방법, 삭제되는 항목, 보관 정책을 안내합니다.",
};

const ADMIN_EMAIL = "nickkim931215@gmail.com";

export default function AccountDeletionPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
        MyPace
      </span>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
        계정 및 데이터 삭제
      </h1>
      <p className="mt-3 text-[14px] text-foreground-muted leading-relaxed">
        MyPace(마이페이스) 앱의 계정과 연결된 데이터를 삭제하는 방법을
        안내합니다.
      </p>

      <section className="mt-9">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          앱에서 직접 삭제하기
        </h2>
        <ol className="mt-3 flex flex-col gap-2 text-[14px] text-foreground-muted leading-relaxed list-decimal pl-5">
          <li>MyPace 앱에 로그인합니다.</li>
          <li>
            <span className="text-foreground font-medium">내 프로필</span>{" "}
            화면으로 이동합니다.
          </li>
          <li>
            맨 아래{" "}
            <span className="text-foreground font-medium">계정 삭제</span>를 눌러
            안내에 따라 영구 삭제합니다.
          </li>
        </ol>
      </section>

      <section className="mt-9">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          이메일로 요청하기
        </h2>
        <p className="mt-3 text-[14px] text-foreground-muted leading-relaxed">
          앱에 접근할 수 없는 경우, 가입에 사용한 이메일 주소로 아래로 삭제를
          요청해 주세요. 본인 확인 후 처리해 드립니다.
        </p>
        <a
          href={`mailto:${ADMIN_EMAIL}?subject=MyPace 계정 삭제 요청`}
          className="mt-3 inline-block text-[14px] text-accent underline underline-offset-2"
        >
          {ADMIN_EMAIL}
        </a>
      </section>

      <section className="mt-9">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          삭제되는 데이터
        </h2>
        <ul className="mt-3 flex flex-col gap-1.5 text-[14px] text-foreground-muted leading-relaxed list-disc pl-5">
          <li>계정(로그인) 정보 및 이메일</li>
          <li>프로필과 닉네임</li>
          <li>운동 기록 및 저장한 루틴</li>
          <li>커뮤니티에 작성한 게시물</li>
          <li>팔로우 관계 및 알림</li>
        </ul>
        <p className="mt-3 text-[13px] text-foreground-dim leading-relaxed">
          계정 삭제는 즉시 처리되며 되돌릴 수 없습니다. 다른 사용자의 게시물에
          남긴 댓글 등 일부 커뮤니티 활동은 익명화된 형태로 남을 수 있으며, 전체
          삭제를 원하시면 위 이메일로 요청해 주세요. 시스템 백업에 포함된
          데이터는 최대 30일 이내에 영구 삭제됩니다.
        </p>
      </section>

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

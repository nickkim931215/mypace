"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { useT } from "@/lib/i18n";

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="border-t border-border-subtle mt-auto">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <Logo size={22} />
        <div className="flex items-center gap-6 text-[13px] text-foreground-muted">
          <Link href="/advertise" className="hover:text-foreground transition-colors">
            {t("광고문의", "Advertise")}
          </Link>
          <Link href="/community" className="hover:text-foreground transition-colors">
            {t("커뮤니티", "Community")}
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            {t("이용약관", "Terms")}
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            {t("개인정보처리방침", "Privacy Policy")}
          </Link>
          <a
            href="mailto:nickkim931215@gmail.com"
            className="hover:text-foreground transition-colors"
          >
            contact
          </a>
        </div>
        <div className="text-[12px] text-foreground-dim">
          © 2026 MyPace
        </div>
      </div>
    </footer>
  );
}

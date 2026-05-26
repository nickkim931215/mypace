import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle mt-auto">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <Logo size={22} />
        <div className="flex items-center gap-6 text-[13px] text-foreground-muted">
          <Link href="/advertise" className="hover:text-foreground transition-colors">
            광고문의
          </Link>
          <Link href="/community" className="hover:text-foreground transition-colors">
            커뮤니티
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

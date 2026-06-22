"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/community/notification-bell";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const t = useT();
  const NAV = [
    { href: "/timer", label: t("타이머", "Timer"), short: t("타이머", "Timer") },
    { href: "/discover", label: t("AI 추천", "AI Picks"), short: t("AI추천", "AI") },
    { href: "/community", label: t("커뮤니티", "Community"), short: t("커뮤니티", "Community") },
    { href: "/history", label: t("내 기록", "Records"), short: t("내기록", "Records") },
    { href: "/profile", label: t("프로필", "Profile"), short: t("프로필", "Profile") },
    { href: "/advertise", label: t("광고문의", "Advertise"), short: t("광고문의", "Ads") },
  ];
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border-subtle pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-6xl px-[max(1.25rem,env(safe-area-inset-left))] sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="MyPace home">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 h-9 inline-flex items-center text-sm transition-colors rounded-full",
                isActive(item.href)
                  ? "text-foreground"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/timer" className="hidden sm:block">
            <Button size="sm" variant="primary">
              {t("시작하기", "Get started")}
            </Button>
          </Link>
          <NotificationBell />
          <UserMenu />
        </div>
      </div>

      {/* Mobile inline nav — all destinations visible in one tappable row so
          phone users can jump between pages without opening a menu. */}
      <nav className="md:hidden flex items-stretch border-t border-border-subtle px-[max(0.25rem,env(safe-area-inset-left))] pr-[max(0.25rem,env(safe-area-inset-right))]">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 min-w-0 h-11 flex items-center justify-center text-center text-[12px] whitespace-nowrap transition-colors relative",
              isActive(item.href)
                ? "text-accent font-medium after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-5 after:rounded-full after:bg-accent"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            {item.short}
          </Link>
        ))}
      </nav>
    </header>
  );
}

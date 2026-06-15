"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/community/notification-bell";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/timer", label: "타이머", short: "타이머" },
  { href: "/discover", label: "AI 추천", short: "AI추천" },
  { href: "/community", label: "커뮤니티", short: "커뮤니티" },
  { href: "/history", label: "내 기록", short: "내기록" },
  { href: "/profile", label: "프로필", short: "프로필" },
  { href: "/advertise", label: "광고문의", short: "광고문의" },
];

export function SiteHeader() {
  const pathname = usePathname();
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
              시작하기
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

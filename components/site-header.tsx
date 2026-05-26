"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/timer", label: "타이머" },
  { href: "/discover", label: "AI 추천" },
  { href: "/community", label: "커뮤니티" },
  { href: "/advertise", label: "광고문의" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border-subtle">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="MyPace home">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 h-9 inline-flex items-center text-sm text-foreground-muted hover:text-foreground transition-colors rounded-full"
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
        </div>
      </div>
    </header>
  );
}

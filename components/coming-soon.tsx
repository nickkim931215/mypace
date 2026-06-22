"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/lib/i18n";

export function ComingSoon({
  phase,
  title,
  description,
}: {
  phase: string;
  title: string;
  description: string;
}) {
  const t = useT();
  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-2xl px-5 sm:px-8 py-24 sm:py-36">
        <span className="text-[11px] uppercase tracking-[0.2em] text-accent">
          {phase}
        </span>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl tracking-[-0.03em] font-semibold">
          {title}
        </h1>
        <p className="mt-5 text-foreground-muted text-[15px] leading-relaxed">
          {description}
        </p>
        <Link href="/" className="inline-block mt-10">
          <Button variant="secondary" size="md">
            <ArrowLeft size={16} />
            {t("홈으로", "Home")}
          </Button>
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}

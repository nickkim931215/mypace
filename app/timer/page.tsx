"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useTimerStore } from "@/store/timer-store";
import { RoutineHeader } from "@/components/builder/routine-header";
import { RoundList } from "@/components/builder/round-list";
import { AddRoundBar } from "@/components/builder/add-round-bar";
import { SoundSettings } from "@/components/timer/sound-settings";
import { useT } from "@/lib/i18n";

export default function TimerBuilderPage() {
  const t = useT();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const routine = useTimerStore((s) =>
    s.routines.find((r) => r.id === s.currentRoutineId) ?? s.routines[0] ?? null,
  );

  if (!hydrated || !routine) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1 mx-auto w-full max-w-3xl px-5 sm:px-8 py-16">
          <div className="h-10 w-40 bg-surface-2 rounded-full animate-pulse mb-6" />
          <div className="h-16 w-3/4 bg-surface-2 rounded-2xl animate-pulse mb-8" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-surface-1 border border-border-subtle rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-3xl px-5 sm:px-8 py-10 sm:py-14">
        <RoutineHeader routine={routine} />
        <div className="mt-10 flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-foreground-dim px-1">
            {t("라운드", "Rounds")}
          </span>
          <RoundList routine={routine} />
          <AddRoundBar routineId={routine.id} />
        </div>

        <div className="mt-10 flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-foreground-dim px-1">
            {t("사운드 & 설정", "Sound & Settings")}
          </span>
          <SoundSettings />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

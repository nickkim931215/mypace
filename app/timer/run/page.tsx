"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTimerStore } from "@/store/timer-store";
import { RunScreen } from "@/components/timer/run-screen";

export default function TimerRunPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const routine = useTimerStore((s) =>
    s.routines.find((r) => r.id === s.currentRoutineId) ?? s.routines[0] ?? null,
  );

  useEffect(() => {
    if (hydrated && !routine) router.replace("/timer");
  }, [hydrated, routine, router]);

  if (!hydrated || !routine) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center text-foreground-muted text-sm">
        로딩 중…
      </div>
    );
  }

  if (routine.rounds.length === 0) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6 text-center">
        <p className="text-foreground-muted mb-5">
          이 루틴에는 라운드가 없습니다.
        </p>
        <button
          onClick={() => router.push("/timer")}
          className="h-11 px-5 rounded-full bg-accent text-black font-medium"
        >
          빌더로 돌아가기
        </button>
      </div>
    );
  }

  return <RunScreen routine={routine} />;
}

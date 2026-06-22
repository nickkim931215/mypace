"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { trackEvent } from "@/lib/analytics";
import { SiteFooter } from "@/components/site-footer";
import { BodySelector } from "@/components/discover/body-selector";
import { PreferencesForm } from "@/components/discover/preferences-form";
import {
  RecommendationResult,
  RecommendationLoading,
  RecommendationError,
} from "@/components/discover/recommendation-result";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import type {
  BodyPart,
  Equipment,
  Intensity,
  RecommendResult,
} from "@/lib/ai-recommend";
import { BODY_PART_LABEL } from "@/lib/ai-recommend";
import { useTimerStore } from "@/store/timer-store";
import { useT, useLocale, type TranslateFn } from "@/lib/i18n";

type Status = "idle" | "loading" | "ready" | "error";

const BODY_PART_LABEL_EN: Record<BodyPart, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  arms: "Arms",
  core: "Core",
  legs: "Legs",
  full: "Full body",
};

function bodyPartLabel(part: BodyPart, t: TranslateFn) {
  return t(BODY_PART_LABEL[part], BODY_PART_LABEL_EN[part]);
}

export default function DiscoverPage() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const createRoutine = useTimerStore((s) => s.createRoutine);
  const selectRoutine = useTimerStore((s) => s.selectRoutine);

  const [bodyPart, setBodyPart] = useState<BodyPart | null>(null);
  const [minutes, setMinutes] = useState(10);
  const [intensity, setIntensity] = useState<Intensity>("medium");
  const [equipment, setEquipment] = useState<Equipment[]>(["bodyweight"]);

  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = bodyPart !== null;

  const generate = async () => {
    if (!bodyPart) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bodyPart,
          minutes,
          intensity,
          equipment,
          locale,
        }),
      });
      if (!res.ok)
        throw new Error(t(`서버 오류 (${res.status})`, `Server error (${res.status})`));
      const data = (await res.json()) as RecommendResult;
      setResult(data);
      setStatus("ready");
      trackEvent("recommend_requested", {
        bodyPart,
        intensity,
        minutes,
        source: data.source,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("AI 호출 실패", "AI request failed"));
      setStatus("error");
    }
  };

  const todayStamp = () => {
    const d = new Date();
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  const saveToLibrary = (start: boolean) => {
    if (!result) return;
    const id = createRoutine({
      name: `${result.name} · ${todayStamp()}`,
      description: result.description,
      rounds: result.rounds,
      tags: bodyPart ? [bodyPart, "ai"] : ["ai"],
    });
    selectRoutine(id);
    router.push(start ? "/timer/run" : "/timer");
  };

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-3xl px-5 sm:px-8 py-10 sm:py-14">
        <header className="mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-accent">
            <Sparkles size={12} />
            AI Workout
          </span>
          <h1 className="mt-3 font-display text-3xl sm:text-5xl tracking-[-0.03em] font-semibold">
            {t("부위 하나만 골라주세요.", "Just pick one body part.")}
          </h1>
          <p className="mt-3 text-foreground-muted text-[15px] leading-relaxed max-w-xl">
            {t(
              "오늘의 운동 루틴을 만들어 드릴게요. 시간, 강도, 보유 기구만 알려주시면 됩니다.",
              "We'll build today's workout routine for you. Just tell us the time, intensity, and equipment you have.",
            )}
          </p>
        </header>

        <section className="card-premium p-6 sm:p-8">
          <BodySelector selected={bodyPart} onSelect={setBodyPart} />
        </section>

        <section className="mt-6 card-premium p-6 sm:p-8">
          <PreferencesForm
            minutes={minutes}
            onMinutesChange={setMinutes}
            intensity={intensity}
            onIntensityChange={setIntensity}
            equipment={equipment}
            onEquipmentChange={setEquipment}
          />
        </section>

        <div className="sticky bottom-4 sm:bottom-6 mt-6 z-20">
          <div className="card-premium p-3 sm:p-4 backdrop-blur-xl bg-background/80 flex items-center justify-between gap-3">
            <div className="min-w-0 text-[13px] text-foreground-muted truncate">
              {bodyPart ? (
                <>
                  <span className="text-foreground font-medium">
                    {bodyPartLabel(bodyPart, t)}
                  </span>
                  <span className="text-foreground-dim">
                    {" "}
                    · {t(`${minutes}분`, `${minutes} min`)} ·{" "}
                    {intensity === "easy"
                      ? t("초급", "Beginner")
                      : intensity === "medium"
                        ? t("중급", "Intermediate")
                        : t("고급", "Advanced")}
                  </span>
                </>
              ) : (
                t("부위를 먼저 선택하세요", "Select a body part first")
              )}
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={generate}
              disabled={!canGenerate || status === "loading"}
            >
              <Sparkles size={14} />
              {status === "loading"
                ? t("생성 중…", "Generating…")
                : t("루틴 추천 받기", "Get routine")}
            </Button>
          </div>
        </div>

        <section className="mt-8">
          {status === "loading" && <RecommendationLoading />}
          {status === "error" && error && (
            <RecommendationError message={error} onRetry={generate} />
          )}
          {status === "ready" && result && (
            <RecommendationResult
              result={result}
              onSaveAndStart={() => saveToLibrary(true)}
              onSaveOnly={() => saveToLibrary(false)}
              onRegenerate={generate}
            />
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

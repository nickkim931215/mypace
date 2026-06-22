"use client";

import { motion } from "framer-motion";
import { Timer, Sparkles, Users, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export function FeatureGrid() {
  const t = useT();
  const features = [
    {
      icon: Timer,
      title: t("인터벌 타이머", "Interval Timer"),
      desc: t("운동·휴식 라운드를 자유롭게 조합.", "Mix work and rest rounds however you like."),
      accent: "text-accent",
    },
    {
      icon: Sparkles,
      title: t("AI 부위별 추천", "AI Muscle-Group Picks"),
      desc: t("시간·강도만 알려주면 루틴을 통째로.", "Just give us time and intensity — we'll build the whole routine."),
      accent: "text-accent",
    },
    {
      icon: Users,
      title: t("루틴 커뮤니티", "Routine Community"),
      desc: t("내 루틴·영상을 공유하고 한 탭으로 시작.", "Share your routines and videos, start with one tap."),
      accent: "text-rest",
    },
    {
      icon: Megaphone,
      title: t("트레이너 광고", "Trainer Ads"),
      desc: t("유튜브 영상을 배너에. 30·60·90일 노출.", "Put your YouTube videos on a banner. 30/60/90-day runs."),
      accent: "text-foreground",
    },
  ] as const;

  return (
    <section className="mx-auto max-w-5xl px-5 sm:px-8 py-9 sm:py-12 border-t border-border-subtle">
      <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
        <span className="text-[11px] uppercase tracking-[0.2em] text-foreground-dim">
          What's inside
        </span>
        <h2 className="mt-1.5 font-display text-xl sm:text-2xl tracking-[-0.02em] font-semibold">
          {t("하나의 앱, 운동의 모든 박자", "One app, every beat of your workout")}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="card-premium px-4 py-3.5 flex items-center gap-3"
          >
            <div
              className={cn(
                "h-9 w-9 rounded-xl bg-surface-2 flex items-center justify-center shrink-0",
                f.accent,
              )}
            >
              <f.icon size={17} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[14px] font-semibold tracking-tight">
                {f.title}
              </h3>
              <p className="text-[12px] text-foreground-muted leading-snug truncate">
                {f.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

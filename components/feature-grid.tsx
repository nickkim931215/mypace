"use client";

import { motion } from "framer-motion";
import { Timer, Music2, Sparkles, Users, Megaphone, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Timer,
    title: "인터벌 타이머",
    desc: "운동·휴식 라운드를 자유롭게 조합. 드래그로 순서를 바꾸고 즐겨찾기.",
    accent: "text-accent",
  },
  {
    icon: Music2,
    title: "메트로놈 리듬",
    desc: "BPM 슬라이더로 운동마다 리듬을. 크런치 80, 점프 140 — 박자에 맞춰.",
    accent: "text-work",
  },
  {
    icon: Sparkles,
    title: "AI 부위별 추천",
    desc: "복부·등·하체. 시간과 강도만 알려주면 루틴을 통째로 만들어 드려요.",
    accent: "text-accent",
  },
  {
    icon: Users,
    title: "루틴 커뮤니티",
    desc: "내가 만든 루틴과 영상을 공유. 좋아하는 루틴은 한 번 탭으로 시작.",
    accent: "text-rest",
  },
  {
    icon: Megaphone,
    title: "트레이너 광고",
    desc: "유튜브 운동 영상을 4개 배너에. 30·60·90일 구독으로 노출.",
    accent: "text-foreground",
  },
  {
    icon: Volume2,
    title: "프리미엄 사운드",
    desc: "Minimal · Gym Pro · Zen 3가지 사운드 팩과 한국어 보이스 가이드.",
    accent: "text-foreground",
  },
] as const;

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-8 py-20 sm:py-28">
      <div className="flex flex-col items-center text-center mb-12 sm:mb-16">
        <span className="text-[11px] uppercase tracking-[0.2em] text-foreground-dim">
          What's inside
        </span>
        <h2 className="mt-3 font-display text-3xl sm:text-5xl tracking-[-0.03em] font-semibold">
          하나의 앱, 운동의 모든 박자
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="card-premium p-6 sm:p-7 hover:translate-y-[-2px] transition-transform"
          >
            <div
              className={cn(
                "h-11 w-11 rounded-2xl bg-surface-2 flex items-center justify-center",
                f.accent,
              )}
            >
              <f.icon size={20} />
            </div>
            <h3 className="mt-5 text-[17px] font-semibold tracking-tight">
              {f.title}
            </h3>
            <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
              {f.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

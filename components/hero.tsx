"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export function Hero() {
  const t = useT();
  return (
    <section className="relative overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(800px 500px at 50% -10%, rgba(212,255,63,0.18), transparent 60%), radial-gradient(600px 400px at 80% 110%, rgba(59,130,246,0.12), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-20 sm:pt-32 pb-24 sm:pb-40">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-1/60 backdrop-blur-sm px-3 h-8 text-[12px] text-foreground-muted">
            <Sparkles size={12} className="text-accent" />
            Record &amp; share your own workout routines.
          </span>

          <h1 className="mt-7 font-display text-[clamp(2.1rem,8.5vw,4.5rem)] leading-[1.05] sm:leading-[0.95] tracking-[-0.04em] font-semibold">
            {t("나만의 운동 루틴,", "Your own workout routine,")}
            <br />
            <span className="text-accent">{t("기록하고", "record")}</span>{" "}
            {t("공유하다", "& share")}
          </h1>

          <p className="mt-6 max-w-xl text-balance text-[15px] sm:text-lg text-foreground-muted leading-relaxed">
            {t(
              "인터벌 타이머 · 메트로놈 · AI 부위별 추천 · 루틴 커뮤니티까지. 모든 운동의 박자를 한 곳에서.",
              "Interval timer · metronome · AI muscle-group picks · routine community. Every beat of your workout, in one place.",
            )}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
            <Link href="/timer">
              <Button size="lg" variant="primary" className="group">
                {t("지금 시작하기", "Start now")}
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Button>
            </Link>
            <Link href="/discover">
              <Button size="lg" variant="secondary">
                {t("AI 추천 받아보기", "Get AI picks")}
              </Button>
            </Link>
          </div>

          {/* Floating preview card */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.25,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-10 w-full max-w-sm card-premium p-6 sm:p-7"
          >
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-foreground-dim">
              <span>Round 2 of 8</span>
              <span className="text-work">● Work</span>
            </div>
            <div className="mt-3 text-center">
              <div className="text-sm text-foreground-muted">Plank</div>
              <div className="tabular font-display font-semibold text-[60px] sm:text-[76px] leading-none tracking-[-0.04em] mt-1 text-foreground">
                00:40
              </div>
              <div className="mt-2 text-[13px] text-foreground-muted">
                {t("다음 — 휴식 20초", "Next — Rest 20s")}
              </div>
            </div>
            <div className="mt-5 h-1.5 rounded-full bg-surface-3 overflow-hidden">
              <motion.div
                className="h-full bg-accent"
                initial={{ width: "0%" }}
                animate={{ width: "62%" }}
                transition={{ delay: 0.7, duration: 1.2, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

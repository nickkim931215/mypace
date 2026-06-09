"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Badge } from "@/lib/badges";

// Full-screen celebration shown the first time the user unlocks one or more
// badges. Pure presentational — the parent computes which badges are new and
// marks them seen.
export function BadgeCelebration({
  badges,
  onClose,
}: {
  badges: Badge[];
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (badges.length === 0) return null;
  const multiple = badges.length > 1;

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm px-6"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-sm card-premium border-accent/40 bg-accent/[0.05] px-6 py-8 text-center overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.8, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
        >
          {/* glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-accent/25 blur-3xl"
          />

          <p className="relative text-[11px] uppercase tracking-[0.25em] text-accent font-medium">
            새 배지 획득
          </p>
          <h2 className="relative mt-2 font-display text-2xl font-semibold tracking-tight">
            {multiple ? `배지 ${badges.length}개를 땄어요! 🎉` : "축하해요! 🎉"}
          </h2>

          <div className="relative mt-6 flex flex-wrap items-stretch justify-center gap-3">
            {badges.slice(0, 6).map((b, i) => (
              <motion.div
                key={b.id}
                className="flex flex-col items-center gap-1.5 w-24"
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 16,
                  delay: 0.15 + i * 0.12,
                }}
              >
                <span className="h-16 w-16 rounded-2xl bg-accent/15 border border-accent/40 flex items-center justify-center text-[34px] drop-shadow-[0_0_12px_rgba(212,255,63,0.4)]">
                  {b.emoji}
                </span>
                <span className="text-[13px] font-medium leading-tight">
                  {b.name}
                </span>
                <span className="text-[11px] text-foreground-muted leading-tight">
                  {b.description}
                </span>
              </motion.div>
            ))}
          </div>

          <Button
            variant="primary"
            size="lg"
            className="relative mt-8 w-full"
            onClick={onClose}
          >
            좋아요!
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

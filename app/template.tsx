"use client";

import { motion, useReducedMotion } from "framer-motion";

// Cross-fade between top-level routes. Opacity only — a transform here would
// establish a containing block and break the run screen's `position: fixed`
// overlay, which lives under this same (first-segment) template instance.
// The flex classes mirror the layout pages expect from <body> so that each
// page's `<main className="flex-1">` keeps filling the viewport.
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}

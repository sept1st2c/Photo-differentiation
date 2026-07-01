"use client";

import { motion } from "framer-motion";

export default function ScrollCue({ targetId }: { targetId: string }) {
  return (
    <button
      onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" })}
      className="group flex flex-col items-center gap-2 text-xs uppercase tracking-widest text-slate-500 transition hover:text-emerald-400"
    >
      Scroll to see it all
      <motion.span
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="text-lg"
      >
        ↓
      </motion.span>
    </button>
  );
}

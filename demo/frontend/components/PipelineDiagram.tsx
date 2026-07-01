"use client";

import { motion } from "framer-motion";

const steps = [
  { title: "Input photo", detail: ".jpg, full resolution" },
  { title: "Patch grid", detail: "128×128 cells, ~16/image" },
  { title: "6 features / patch", detail: "FFT · LBP · noise · color" },
  { title: "HistGradientBoosting", detail: "P(screen) per patch" },
  { title: "Weighted aggregate", detail: "score in [0, 1]" },
];

export default function PipelineDiagram() {
  return (
    <div className="relative flex flex-col items-stretch gap-3 md:flex-row md:items-center">
      {steps.map((s, i) => (
        <motion.div
          key={s.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: i * 0.12 }}
          className="flex items-center gap-3"
        >
          <div className="relative flex min-w-[150px] flex-1 flex-col items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center">
            <motion.div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent"
              initial={{ x: "-100%" }}
              whileInView={{ x: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.4 + i * 0.12, ease: "easeInOut" }}
            />
            <span className="relative text-sm font-semibold text-white">{s.title}</span>
            <span className="relative mt-1 text-xs text-slate-400">{s.detail}</span>
          </div>
          {i < steps.length - 1 && (
            <motion.span
              className="hidden shrink-0 text-emerald-400 md:block"
              aria-hidden
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
            >
              →
            </motion.span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

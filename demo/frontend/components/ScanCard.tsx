"use client";

import { motion } from "framer-motion";

const stages = [
  { label: "Patch grid", detail: "128×128 cells" },
  { label: "Features", detail: "FFT · LBP · noise · color" },
  { label: "Classify", detail: "P(screen) / patch" },
  { label: "Aggregate", detail: "moiré-weighted score" },
];

const GRID = 4; // matches the real ~4x4 patch grid used per image

export default function ScanCard({ file, name }: { file: string; name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative mb-4 overflow-hidden rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-400/[0.07] via-transparent to-transparent p-5"
    >
      {/* ambient pulsing glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        animate={{ boxShadow: ["inset 0 0 0px rgba(52,211,153,0)", "inset 0 0 40px rgba(52,211,153,0.12)", "inset 0 0 0px rgba(52,211,153,0)"] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative flex items-center gap-5">
        {/* Thumbnail with real patch-grid overlay */}
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-white/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={file} alt="" className="h-full w-full object-cover" />

          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
            {Array.from({ length: GRID * GRID }).map((_, i) => (
              <motion.div
                key={i}
                className="border border-emerald-300/25"
                animate={{ backgroundColor: ["rgba(52,211,153,0)", "rgba(52,211,153,0.45)", "rgba(52,211,153,0)"] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: ((i % GRID) * 0.12 + Math.floor(i / GRID) * 0.12) % 1.8,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* viewfinder-style scan corners */}
          {[
            "left-0 top-0 border-l-2 border-t-2",
            "right-0 top-0 border-r-2 border-t-2",
            "left-0 bottom-0 border-l-2 border-b-2",
            "right-0 bottom-0 border-r-2 border-b-2",
          ].map((pos) => (
            <div key={pos} className={`absolute h-3 w-3 border-emerald-300 ${pos}`} />
          ))}

          {/* sweeping scan line */}
          <motion.div
            className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-white/40 to-transparent"
            animate={{ y: [-32, 112] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <p className="truncate text-sm font-medium text-white">{name}</p>
          </div>

          <div className="relative mt-4 flex items-center">
            {stages.map((s, i) => (
              <div key={s.label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <motion.div
                    className="flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold"
                    animate={{
                      borderColor: ["rgba(255,255,255,0.15)", "#34d399", "rgba(255,255,255,0.15)"],
                      color: ["#64748b", "#34d399", "#64748b"],
                    }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
                  >
                    {i + 1}
                  </motion.div>
                  <span className="max-w-[64px] text-center text-[10px] leading-tight text-slate-500">
                    {s.label}
                  </span>
                </div>
                {i < stages.length - 1 && (
                  <div className="mx-1 h-px flex-1 overflow-hidden bg-white/10">
                    <motion.div
                      className="h-full w-full bg-emerald-400"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

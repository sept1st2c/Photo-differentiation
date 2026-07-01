"use client";

import { motion } from "framer-motion";

const stages = ["Patch grid", "FFT · LBP · noise · color", "Classify", "Aggregate"];

export default function ScanCard({ file, name }: { file: string; name: string }) {
  return (
    <div className="mb-4 flex items-center gap-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.04] p-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={file} alt="" className="h-full w-full object-cover" />
        <motion.div
          className="absolute inset-x-0 h-6 bg-gradient-to-b from-transparent via-emerald-300/70 to-transparent"
          animate={{ y: [-24, 64] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{name}</p>
        <div className="mt-2 flex items-center gap-1.5">
          {stages.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-1.5">
              <motion.div
                className="h-1 flex-1 rounded-full bg-white/10"
                animate={{ backgroundColor: ["rgba(255,255,255,0.1)", "#34d399", "rgba(255,255,255,0.1)"] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-wide text-slate-500">
          <span>{stages[0]}</span>
          <span>{stages[stages.length - 1]}</span>
        </div>
      </div>
    </div>
  );
}

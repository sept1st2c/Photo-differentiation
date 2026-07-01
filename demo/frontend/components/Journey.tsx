"use client";

import { motion } from "framer-motion";
import { journey } from "@/lib/data";

const statusStyle = {
  baseline: { dot: "bg-slate-500", text: "text-slate-400", ring: "ring-slate-500/30", badge: "Baseline" },
  improved: { dot: "bg-emerald-400", text: "text-emerald-400", ring: "ring-emerald-400/40", badge: "Improved" },
  reverted: { dot: "bg-rose-400", text: "text-rose-400", ring: "ring-rose-400/40", badge: "Reverted" },
  shipped: { dot: "bg-emerald-400", text: "text-emerald-400", ring: "ring-emerald-400/60", badge: "Shipped" },
};

export default function Journey() {
  return (
    <div className="relative pl-8">
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent" />
      <div className="flex flex-col gap-6">
        {journey.map((item, i) => {
          const s = statusStyle[item.status];
          return (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="relative"
            >
              <span
                className={`absolute -left-8 top-1.5 h-[10px] w-[10px] rounded-full ring-4 ${s.dot} ${s.ring}`}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-sm font-semibold text-white">
                  {item.step}. {item.title}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${s.text}`}>{s.badge}</span>
                  <span className="text-sm font-bold tabular-nums text-white">{item.metric}</span>
                </div>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.detail}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

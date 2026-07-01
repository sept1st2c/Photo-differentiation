"use client";

import { motion } from "framer-motion";
import { BACKEND_LIVE_URL, REPO_URL, techStack } from "@/lib/data";

function LiveBadge({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/[0.06] px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/[0.12]"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      {label}
      <span className="text-emerald-400/60 transition group-hover:translate-x-0.5">→</span>
    </a>
  );
}

export default function TechStack() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-3">
        <LiveBadge label="Frontend live on Vercel" href="https://photo-differentiation.vercel.app" />
        <LiveBadge label="Backend live on Render" href={BACKEND_LIVE_URL + "/health"} />
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5"
        >
          Source on GitHub →
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {techStack.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
          >
            <p className="text-sm font-semibold text-white">{t.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">{t.role}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

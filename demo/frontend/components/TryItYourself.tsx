"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BatchTest from "@/components/BatchTest";
import CameraDemo from "@/components/CameraDemo";

const tabs = [
  { id: "batch", label: "Upload / batch test" },
  { id: "camera", label: "Live camera", badge: "patched" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function TryItYourself() {
  const [tab, setTab] = useState<TabId>("batch");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div className="mb-6 inline-flex rounded-full border border-white/10 bg-black/40 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === t.id ? "text-slate-950" : "text-slate-300 hover:text-white"
            }`}
          >
            {tab === t.id && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-full bg-emerald-400"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{t.label}</span>
            {"badge" in t && t.badge && (
              <span
                className={`relative rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  tab === t.id ? "bg-slate-950/15 text-slate-950" : "bg-amber-400/15 text-amber-300"
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "batch" ? (
          <motion.div
            key="batch"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <p className="mb-5 max-w-2xl text-sm text-slate-400">
              Drop in as many of your own photos as you like — each one is scored by the same
              pipeline, one request at a time, with a running scoreboard. This is the most
              reliable way to test it: real phone photos, full resolution, exactly what
              predict.py sees.
            </p>
            <BatchTest />
          </motion.div>
        ) : (
          <motion.div
            key="camera"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <p className="mb-2 max-w-2xl text-sm text-slate-400">
              Runs the exact <code className="rounded bg-white/5 px-1 py-0.5">predict.py</code>{" "}
              pipeline on live camera frames. Point it at something real, then at a laptop or
              phone screen showing a photo.
            </p>
            <p className="mb-5 max-w-2xl text-xs text-amber-300/90">
              Recently patched: webcams/browsers often default to a low capture resolution, and
              the moiré signal this model relies on doesn&apos;t survive downsizing — same
              finding as the resolution experiment in the journey below. Now requests the highest
              resolution the camera offers. Best tested on a phone browser, not a laptop webcam.
            </p>
            <CameraDemo />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

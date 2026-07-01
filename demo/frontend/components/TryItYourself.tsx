"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BatchTest from "@/components/BatchTest";
import CameraDemo from "@/components/CameraDemo";

const tabs = [
  { id: "camera", label: "Live camera" },
  { id: "batch", label: "Upload / batch test" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function TryItYourself() {
  const [tab, setTab] = useState<TabId>("camera");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div className="mb-6 inline-flex rounded-full border border-white/10 bg-black/40 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition ${
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
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "camera" ? (
          <motion.div
            key="camera"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <p className="mb-5 max-w-2xl text-sm text-slate-400">
              Runs the exact <code className="rounded bg-white/5 px-1 py-0.5">predict.py</code>{" "}
              pipeline on live camera frames. Point it at something real, then at a laptop or
              phone screen showing a photo.
            </p>
            <CameraDemo />
          </motion.div>
        ) : (
          <motion.div
            key="batch"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <p className="mb-5 max-w-2xl text-sm text-slate-400">
              Drop in as many of your own photos as you like — each one is scored by the same
              pipeline, one request at a time, with a running scoreboard.
            </p>
            <BatchTest />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";

// Semicircular gauge: needle at -90deg = score 0 (real), +90deg = score 1 (screen).
// Idle (no score yet) points straight up (neutral), not toward either side.
export default function Gauge({ score }: { score: number | null }) {
  const angle = score === null ? 0 : -90 + score * 180;

  return (
    <svg viewBox="0 0 200 110" className="w-full max-w-[220px]">
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>
      </defs>
      <path
        d="M 15 100 A 85 85 0 0 1 185 100"
        fill="none"
        stroke="url(#gaugeGradient)"
        strokeWidth="14"
        strokeLinecap="round"
        opacity={0.9}
      />
      <motion.line
        x1="100"
        y1="100"
        x2="100"
        y2="28"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ originX: "100px", originY: "100px" }}
        animate={{ rotate: angle }}
        transition={{ type: "spring", stiffness: 90, damping: 14 }}
      />
      <circle cx="100" cy="100" r="6" fill="white" />
    </svg>
  );
}

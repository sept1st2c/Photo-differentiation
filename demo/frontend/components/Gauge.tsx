"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

const CX = 100;
const CY = 100;
const LENGTH = 72;

// Semicircular gauge: angle -90deg = score 0 (real, left), +90deg = score 1
// (screen, right). Idle (no score yet) points straight up (neutral).
//
// Deliberately does NOT use CSS `rotate` + `transform-origin` on an SVG line --
// that combination is unreliable once the SVG is scaled responsively (the
// origin ends up computed against the wrong box in some browsers, which is
// why the needle rendered as a fixed dot with no visible line). Instead the
// needle's tip coordinates are computed directly from the angle and animated
// as plain numbers, which sidesteps transform-origin entirely.
export default function Gauge({ score }: { score: number | null }) {
  const targetAngle = score === null ? 0 : -90 + score * 180;
  const angle = useSpring(targetAngle, { stiffness: 90, damping: 14 });

  useEffect(() => {
    angle.set(targetAngle);
  }, [targetAngle, angle]);

  const x2 = useTransform(angle, (a) => CX + LENGTH * Math.sin((a * Math.PI) / 180));
  const y2 = useTransform(angle, (a) => CY - LENGTH * Math.cos((a * Math.PI) / 180));

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
      <motion.line x1={CX} y1={CY} x2={x2} y2={y2} stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx={CX} cy={CY} r="6" fill="white" />
    </svg>
  );
}

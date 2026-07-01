"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  YAxis,
  Tooltip,
} from "recharts";
import { BACKEND_URL } from "@/lib/data";
import Gauge from "@/components/Gauge";

const CAPTURE_INTERVAL_MS = 1200;
const HISTORY_LENGTH = 24;

type Reading = { t: number; score: number };
type Status = "idle" | "starting" | "live" | "camera-error" | "backend-error";

function verdict(score: number) {
  if (score >= 0.6) return { label: "SCREEN", color: "text-rose-400", ring: "ring-rose-400/60" };
  if (score <= 0.4) return { label: "REAL", color: "text-emerald-400", ring: "ring-emerald-400/60" };
  return { label: "UNSURE", color: "text-amber-300", ring: "ring-amber-300/60" };
}

export default function CameraDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState<number | null>(null);
  const [history, setHistory] = useState<Reading[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const captureAndScore = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const form = new FormData();
        form.append("image", blob, "frame.jpg");
        const t0 = performance.now();
        try {
          const res = await fetch(`${BACKEND_URL}/predict`, { method: "POST", body: form });
          if (!res.ok) throw new Error("backend error");
          const data = await res.json();
          setLatencyMs(Math.round(performance.now() - t0));
          setScore(data.score);
          setStatus("live");
          setHistory((h) => [...h.slice(-(HISTORY_LENGTH - 1)), { t: Date.now(), score: data.score }]);
        } catch {
          setStatus("backend-error");
        }
      },
      "image/jpeg",
      0.85
    );
  }, []);

  const start = useCallback(async () => {
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      timerRef.current = setInterval(captureAndScore, CAPTURE_INTERVAL_MS);
      setStatus("live");
    } catch {
      setStatus("camera-error");
    }
  }, [captureAndScore]);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStatus("idle");
    setScore(null);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const v = score !== null ? verdict(score) : null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/70 text-center">
            <p className="max-w-xs text-sm text-slate-300">
              Runs the exact predict.py pipeline, live, on frames from your camera.
            </p>
            <button
              onClick={start}
              className="rounded-full bg-emerald-400 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Start camera
            </button>
          </div>
        )}

        {status === "camera-error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 p-6 text-center text-sm text-rose-300">
            Couldn&apos;t access the camera. Check browser permissions and reload.
          </div>
        )}

        {status === "backend-error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 p-6 text-center text-sm text-rose-300">
            Can&apos;t reach the backend at {BACKEND_URL}. Run{" "}
            <code className="mx-1 rounded bg-black/40 px-1.5 py-0.5">python demo/backend/server.py</code>{" "}
            and reload.
          </div>
        )}

        {(status === "live" || status === "starting") && (
          <button
            onClick={stop}
            className="absolute right-3 top-3 rounded-full bg-black/50 px-4 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/70"
          >
            Stop
          </button>
        )}
      </div>

      <div className="flex flex-col justify-between gap-4">
        <div
          className={`flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] py-6 ring-1 ring-inset transition ${
            v ? v.ring : "ring-white/5"
          }`}
        >
          <span className="text-xs uppercase tracking-widest text-slate-400">Live score (0 = real, 1 = screen)</span>
          <Gauge score={score} />
          <span className={`-mt-2 text-4xl font-bold tabular-nums ${v ? v.color : "text-slate-500"}`}>
            {score !== null ? score.toFixed(3) : "—"}
          </span>
          {v && <span className={`text-sm font-semibold tracking-wide ${v.color}`}>{v.label}</span>}
          {latencyMs !== null && (
            <span className="text-xs text-slate-500">{latencyMs}ms round-trip (incl. network)</span>
          )}
        </div>

        <div className="h-28 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <span className="text-xs uppercase tracking-widest text-slate-400">Score history</span>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
              <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: "#64748b" }} width={28} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }}
                labelFormatter={() => ""}
                formatter={(val) => [Number(val).toFixed(3), "score"]}
              />
              <Line type="monotone" dataKey="score" stroke="#34d399" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

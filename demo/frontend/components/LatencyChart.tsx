"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { latencyBreakdown, latencyStats } from "@/lib/data";

const colors = ["#f472b6", "#38bdf8", "#34d399"];

export default function LatencyChart() {
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-6">
        <div>
          <span className="text-3xl font-bold text-white tabular-nums">{latencyStats.medianMs}ms</span>
          <span className="ml-2 text-sm text-slate-400">median</span>
        </div>
        <div>
          <span className="text-3xl font-bold text-slate-300 tabular-nums">{latencyStats.p95Ms}ms</span>
          <span className="ml-2 text-sm text-slate-400">p95</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={latencyBreakdown} layout="vertical" margin={{ left: 24, right: 40 }}>
          <CartesianGrid horizontal={false} stroke="#1e293b" />
          <XAxis type="number" unit="ms" tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: "#94a3b8" }} width={150} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }}
            formatter={(val, _n, p) => [`${val}ms (${p.payload.pct}%)`, "time"]}
          />
          <Bar dataKey="ms" radius={[0, 6, 6, 0]} barSize={20}>
            {latencyBreakdown.map((d, i) => (
              <Cell key={d.stage} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-xs text-slate-500">
        Measured by benchmark.py over 50 images, {latencyStats.device}, model already warm. JPEG
        decode of the 12MP source photo dominates — profiled directly, not estimated.
      </p>
    </div>
  );
}

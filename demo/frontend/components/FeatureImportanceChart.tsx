"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { featureImportance } from "@/lib/data";

const groupColor: Record<string, string> = {
  "FFT / moiré": "#34d399",
  "Texture (LBP)": "#38bdf8",
  "Noise residual": "#fbbf24",
  Color: "#f472b6",
  Wavelet: "#a78bfa",
};

export default function FeatureImportanceChart() {
  const data = [...featureImportance].sort((a, b) => a.importance - b.importance);

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24 }}>
          <CartesianGrid horizontal={false} stroke="#1e293b" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: "#94a3b8" }} width={150} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }}
            formatter={(val, _n, p) => [Number(val).toFixed(4), p.payload.group]}
          />
          <Bar dataKey="importance" radius={[0, 6, 6, 0]} barSize={16}>
            {data.map((d) => (
              <Cell key={d.feature} fill={groupColor[d.group]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
        {Object.entries(groupColor).map(([g, c]) => (
          <span key={g} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: c }} /> {g}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Cross-fold permutation importance, averaged across every held-out group-CV fold. Moiré
        (FFT) and screen subpixel texture (LBP) dominate — exactly the physically-grounded signal
        the design targeted.
      </p>
    </div>
  );
}

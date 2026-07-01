"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { iterationHistory } from "@/lib/data";

export default function IterationChart() {
  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={iterationHistory} margin={{ left: -12, right: 12, top: 8 }}>
          <CartesianGrid vertical={false} stroke="#1e293b" />
          <XAxis dataKey="stage" tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
          <Bar dataKey="groupCV" name="Group-CV (honest)" fill="#34d399" radius={[6, 6, 0, 0]} barSize={48} />
          <Bar dataKey="randomSplit" name="Random split (optimistic)" fill="#475569" radius={[6, 6, 0, 0]} barSize={48} />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-3 text-xs text-slate-500">
        Pruning 19 candidate features down to the 6 with consistent-sign importance across every
        fold improved the honest number <em>and</em> narrowed the gap to the optimistic one — the
        signature of removing device-specific noise rather than genuine signal.
      </p>
    </div>
  );
}

"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { negativeExperiments } from "@/lib/data";

export default function NegativeExperimentsChart() {
  const data = [...negativeExperiments].sort((a, b) => a.groupCV - b.groupCV);

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 24, right: 32 }}>
          <CartesianGrid horizontal={false} stroke="#1e293b" />
          <XAxis type="number" unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} width={230} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }}
            formatter={(val) => [`${val}%`, "group-CV accuracy"]}
          />
          <Bar dataKey="groupCV" radius={[0, 6, 6, 0]} barSize={18}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.kept ? "#34d399" : "#475569"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-3 text-xs text-slate-500">
        Every one of these looked reasonable on paper (resolution normalization to remove a device
        confound, a sparser patch grid for latency, a more aggressive score aggregation to catch
        edge cases). All were tested against the full validation set, not cherry-picked examples,
        and reverted when they measured worse than the shipped baseline (highlighted).
      </p>
    </div>
  );
}

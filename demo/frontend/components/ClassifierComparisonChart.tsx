"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { classifierComparison } from "@/lib/data";

export default function ClassifierComparisonChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={classifierComparison} margin={{ left: -12, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} stroke="#1e293b" />
        <XAxis dataKey="classifier" tick={{ fontSize: 11, fill: "#94a3b8" }} interval={0} />
        <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
        <Bar dataKey="groupCV" name="Group-CV (honest)" fill="#34d399" radius={[6, 6, 0, 0]} barSize={36} />
        <Bar dataKey="randomSplit" name="Random split" fill="#475569" radius={[6, 6, 0, 0]} barSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}

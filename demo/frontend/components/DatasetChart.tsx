"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { datasetComposition, totalReal, totalScreen } from "@/lib/data";

export default function DatasetChart() {
  const data = [...datasetComposition].sort((a, b) => a.count - b.count);

  return (
    <div>
      <div className="mb-4 flex gap-6 text-sm">
        <span className="flex items-center gap-2 text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> real ({totalReal} photos)
        </span>
        <span className="flex items-center gap-2 text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> screen ({totalScreen} photos)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24 }}>
          <CartesianGrid horizontal={false} stroke="#1e293b" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis
            type="category"
            dataKey="group"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            width={190}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
            {data.map((d) => (
              <Cell key={d.group} fill={d.label === "real" ? "#34d399" : "#fb7185"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

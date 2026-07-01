"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { iterationHistory } from "@/lib/data";

const SHIPPED_COLOR = "#34d399";
const PREV_COLOR = "#1e3a2f";
const TARGET = 95;

export default function IterationHistoryChart() {
  const last = iterationHistory[iterationHistory.length - 1];

  return (
    <div>
      {/* delta callout */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
          Latest: {last.groupCV}% group-CV
        </div>
        <div className="text-xs text-slate-500">
          Started at {iterationHistory[0].groupCV}% &rarr; improved across{" "}
          {iterationHistory.length} iterations
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={iterationHistory}
          margin={{ left: -12, right: 12, top: 8, bottom: 32 }}
        >
          <CartesianGrid vertical={false} stroke="#1e293b" />
          <XAxis
            dataKey="stage"
            tick={{ fontSize: 10, fill: "#64748b" }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={56}
          />
          <YAxis unit="%" domain={[50, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }}
            formatter={(v) => [`${v}%`]}
          />
          <ReferenceLine
            y={TARGET}
            stroke="#ef4444"
            strokeDasharray="4 3"
            label={{ value: "95% target", fill: "#ef4444", fontSize: 10, position: "insideTopRight" }}
          />
          <Bar dataKey="groupCV" name="Group-CV (honest)" radius={[6, 6, 0, 0]} barSize={48}>
            {iterationHistory.map((entry, i) => (
              <Cell
                key={entry.stage}
                fill={i === iterationHistory.length - 1 ? SHIPPED_COLOR : PREV_COLOR}
                stroke={i === iterationHistory.length - 1 ? SHIPPED_COLOR : "transparent"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p className="mt-2 text-center text-[11px] text-slate-600">
        Group k-fold CV — entire device pairings held out per fold
      </p>
    </div>
  );
}

import { roadmap } from "@/lib/data";

export default function Roadmap() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {roadmap.map((item, i) => (
        <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <span className="text-xs font-semibold text-emerald-400">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="mt-2 text-sm font-semibold text-white">{item.title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}

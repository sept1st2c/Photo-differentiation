import { costPerImage } from "@/lib/data";

export default function CostChart() {
  const max = Math.max(...costPerImage.map((c) => c.costPerMillion), 1);

  return (
    <div className="flex flex-col gap-4">
      {costPerImage.map((c) => (
        <div key={c.deployment}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-medium text-slate-200">{c.deployment}</span>
            <span className="text-slate-400">{c.note}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full ${c.costPerMillion === 0 ? "bg-emerald-400" : "bg-sky-400"}`}
              style={{ width: `${Math.max((c.costPerMillion / max) * 100, 3)}%` }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-slate-500">
        Cloud estimate assumes a 512MB serverless function, ~180ms compute/image,
        ~$0.0000166/GB-s + $0.20/1M requests (Lambda-class pricing) — no batching or cold-start
        amortization, both of which would lower this further.
      </p>
    </div>
  );
}

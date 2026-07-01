import { freshTestResults as f } from "@/lib/data";

function Bar({ correct, total, label, color }: { correct: number; total: number; label: string; color: string }) {
  const pct = (correct / total) * 100;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium text-slate-200">{label}</span>
        <span className="tabular-nums text-slate-400">
          {correct}/{total} correct
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function FreshTestChart() {
  const total = f.realPhotosTotal + f.screenPhotosTotal;
  const correct = f.realPhotosCorrect + f.screenPhotosCorrect;

  return (
    <div className="flex flex-col gap-4">
      <Bar correct={f.realPhotosCorrect} total={f.realPhotosTotal} label="Fresh real photos (stock, never trained on)" color="#34d399" />
      <Bar correct={f.screenPhotosCorrect} total={f.screenPhotosTotal} label="Fresh screen photos (new phone captures)" color="#fb7185" />
      <p className="text-xs text-slate-500">
        {`${correct}/${total} combined`}{" "}
        on data collected after training was finalized. Small sample — a proxy check before
        submission, not a substitute for validation on SalesCode&apos;s own held-out photos.
      </p>
    </div>
  );
}

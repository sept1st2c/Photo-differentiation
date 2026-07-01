const steps = [
  { title: "Input photo", detail: ".jpg, full resolution" },
  { title: "Patch grid", detail: "128×128 cells, ~16/image" },
  { title: "6 features / patch", detail: "FFT · LBP · noise · color" },
  { title: "HistGradientBoosting", detail: "P(screen) per patch" },
  { title: "Mean aggregate", detail: "score in [0, 1]" },
];

export default function PipelineDiagram() {
  return (
    <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
      {steps.map((s, i) => (
        <div key={s.title} className="flex items-center gap-3">
          <div className="flex min-w-[150px] flex-1 flex-col items-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center">
            <span className="text-sm font-semibold text-white">{s.title}</span>
            <span className="mt-1 text-xs text-slate-400">{s.detail}</span>
          </div>
          {i < steps.length - 1 && (
            <span className="hidden shrink-0 text-emerald-400 md:block" aria-hidden>
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

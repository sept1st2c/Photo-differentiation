"use client";

import { useCallback, useRef, useState } from "react";
import { BACKEND_URL } from "@/lib/data";

type Result = {
  name: string;
  score: number | null;
  error: string | null;
  ms: number;
};

function verdict(score: number) {
  if (score >= 0.6) return { label: "SCREEN", color: "text-rose-400", bg: "bg-rose-400/10" };
  if (score <= 0.4) return { label: "REAL", color: "text-emerald-400", bg: "bg-emerald-400/10" };
  return { label: "UNSURE", color: "text-amber-300", bg: "bg-amber-300/10" };
}

// Extend the input element's props to accept the non-standard but
// widely-supported `webkitdirectory` attribute for folder selection.
type DirInputProps = React.InputHTMLAttributes<HTMLInputElement> & { webkitdirectory?: string };

export default function BatchTest() {
  const [results, setResults] = useState<Result[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const cancelRef = useRef(false);

  const runBatch = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    cancelRef.current = false;
    setRunning(true);
    setResults([]);
    setProgress({ done: 0, total: imageFiles.length });

    for (let i = 0; i < imageFiles.length; i++) {
      if (cancelRef.current) break;
      const file = imageFiles[i];
      const form = new FormData();
      form.append("image", file);
      const t0 = performance.now();
      try {
        const res = await fetch(`${BACKEND_URL}/predict`, { method: "POST", body: form });
        const data = await res.json();
        const ms = Math.round(performance.now() - t0);
        if (!res.ok) throw new Error(data.error ?? "backend error");
        setResults((r) => [...r, { name: file.name, score: data.score, error: null, ms }]);
      } catch (e) {
        setResults((r) => [
          ...r,
          { name: file.name, score: null, error: e instanceof Error ? e.message : "failed", ms: 0 },
        ]);
      }
      setProgress({ done: i + 1, total: imageFiles.length });
    }
    setRunning(false);
  }, []);

  const scored = results.filter((r) => r.score !== null);
  const flaggedScreen = scored.filter((r) => (r.score as number) >= 0.5).length;
  const avgMs = scored.length ? Math.round(scored.reduce((a, r) => a + r.ms, 0) / scored.length) : 0;

  const dirProps: DirInputProps = { webkitdirectory: "" };

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length) runBatch(e.dataTransfer.files);
        }}
        className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center"
      >
        <p className="text-sm text-slate-400">
          Drop a batch of photos here, or pick files / a whole folder — every image gets scored by
          the real pipeline, one request per image.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <label className="cursor-pointer rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">
            Select images
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && runBatch(e.target.files)}
            />
          </label>
          <label className="cursor-pointer rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5">
            Select a folder
            <input
              type="file"
              multiple
              className="hidden"
              {...dirProps}
              onChange={(e) => e.target.files && runBatch(e.target.files)}
            />
          </label>
          {running && (
            <button
              onClick={() => {
                cancelRef.current = true;
              }}
              className="rounded-full border border-rose-400/40 px-5 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-400/10"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {progress.total > 0 && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>
              {progress.done}/{progress.total} scored
            </span>
            <span>{running ? "running…" : "done"}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {results.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-xs text-slate-400">Scored</span>
              <p className="text-2xl font-bold text-white tabular-nums">{scored.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-xs text-slate-400">Flagged screen</span>
              <p className="text-2xl font-bold text-rose-400 tabular-nums">{flaggedScreen}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-xs text-slate-400">Flagged real</span>
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">
                {scored.length - flaggedScreen}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-xs text-slate-400">Avg latency</span>
              <p className="text-2xl font-bold text-white tabular-nums">{avgMs}ms</p>
            </div>
          </div>

          <div className="mt-4 max-h-96 overflow-y-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-medium">File</th>
                  <th className="px-4 py-2 font-medium">Score</th>
                  <th className="px-4 py-2 font-medium">Verdict</th>
                  <th className="px-4 py-2 font-medium">Latency</th>
                </tr>
              </thead>
              <tbody>
                {[...results]
                  .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
                  .map((r) => {
                    const v = r.score !== null ? verdict(r.score) : null;
                    return (
                      <tr key={r.name} className="border-t border-white/5">
                        <td className="max-w-[220px] truncate px-4 py-2 text-slate-300">{r.name}</td>
                        <td className="px-4 py-2 tabular-nums text-slate-200">
                          {r.score !== null ? r.score.toFixed(3) : "—"}
                        </td>
                        <td className="px-4 py-2">
                          {v ? (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${v.color} ${v.bg}`}>
                              {v.label}
                            </span>
                          ) : (
                            <span className="text-xs text-rose-400">{r.error}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 tabular-nums text-slate-500">{r.ms || "—"}ms</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

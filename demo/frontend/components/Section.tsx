export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 max-w-2xl">
      <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">{eyebrow}</span>
      <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 text-slate-400">{description}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-6 ${className}`}>{children}</div>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-3xl font-bold text-white tabular-nums">{value}</span>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </Card>
  );
}

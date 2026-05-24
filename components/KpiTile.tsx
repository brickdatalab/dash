type Props = {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  sub?: string;
  pulse?: boolean;
};

export function KpiTile({ label, value, delta, deltaTone = "neutral", sub, pulse }: Props) {
  const tone =
    deltaTone === "positive" ? "text-[var(--color-positive)]" :
    deltaTone === "negative" ? "text-[var(--color-negative)]" : "text-[var(--color-muted)]";
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">{label}</div>
        {pulse && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-positive)] pulse-dot" />}
      </div>
      <div className="mt-3 mono text-[28px] leading-none">{value}</div>
      <div className="mt-2 flex items-center gap-2 text-[12px]">
        {delta && <span className={`${tone} tabular font-medium`}>{delta}</span>}
        {sub && <span className="text-[var(--color-muted)]">{sub}</span>}
      </div>
    </div>
  );
}

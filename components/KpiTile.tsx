type Props = {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  sub?: string;
};

export function KpiTile({ label, value, delta, deltaTone = "neutral", sub }: Props) {
  const tone =
    deltaTone === "positive" ? "text-[var(--color-positive)]" :
    deltaTone === "negative" ? "text-[var(--color-negative)]" : "text-[var(--color-muted)]";
  return (
    <div className="border border-[var(--color-border)] bg-white p-5">
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">{label}</div>
      <div className="mt-2 mono text-[26px] leading-none">{value}</div>
      <div className="mt-2 flex items-center gap-2 text-[12px]">
        {delta && <span className={`${tone} tabular`}>{delta}</span>}
        {sub && <span className="text-[var(--color-muted)]">{sub}</span>}
      </div>
    </div>
  );
}

import { money } from "@/lib/format";

type Sub = { id: string; name: string; liquidity_balance: number };

export function LiquidityPanel({ subs }: { subs: Sub[] }) {
  const tradable = subs.reduce((s, x) => s + Number(x.liquidity_balance), 0);
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">Liquidity</div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">USDC available</div>
      </div>
      <div className="mt-4 space-y-3">
        {subs.map((s) => (
          <div key={s.id} className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] last:border-0 last:pb-0">
            <div className="text-[13px]">{s.name}</div>
            <div className="mono text-[16px] tabular">{money(Number(s.liquidity_balance), { decimals: 0 })}</div>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-[var(--color-border-strong)]">
          <div className="text-[11px] uppercase tracking-wider text-[var(--color-fg)] font-medium">Tradable</div>
          <div className="mono text-[20px] tabular font-semibold">{money(tradable, { decimals: 0 })}</div>
        </div>
      </div>
    </div>
  );
}

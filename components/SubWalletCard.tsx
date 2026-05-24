import { money, pct } from "@/lib/format";

type Props = {
  name: string;
  startingBalance: number;
  currentBalance: number;
  efficiency: number;        // 0..1
  hasEffData: boolean;
};

export function SubWalletCard({ name, startingBalance, currentBalance, efficiency, hasEffData }: Props) {
  const pnl = currentBalance - startingBalance;
  const roi = startingBalance > 0 ? (pnl / startingBalance) * 100 : 0;
  const positive = pnl >= 0;
  const effPct = efficiency * 100;
  const effTone =
    effPct >= 95 ? "text-[var(--color-positive)]" :
    effPct >= 85 ? "text-[var(--color-fg)]" :
    "text-[var(--color-warning)]";
  const effBar =
    effPct >= 95 ? "bg-[var(--color-positive)]" :
    effPct >= 85 ? "bg-[var(--color-accent)]" :
    "bg-[var(--color-warning)]";

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold">{name}</div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Sub-wallet</div>
      </div>
      <div className="mt-3 mono text-[26px] leading-none tabular">{money(currentBalance, { decimals: 0 })}</div>
      <div className="mt-3 grid grid-cols-3 gap-3 pt-3 border-t border-[var(--color-border)]">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Started</div>
          <div className="mono text-[13px] mt-1">{money(startingBalance, { decimals: 0 })}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">PnL</div>
          <div className={`mono text-[13px] mt-1 font-medium ${positive ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"}`}>
            {money(pnl, { sign: true, decimals: 0 })}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">ROI</div>
          <div className={`mono text-[13px] mt-1 font-medium ${positive ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"}`}>
            {pct(roi, 1)}
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between text-[11px]">
          <div className="text-[var(--color-muted)] uppercase tracking-wider">Capacity efficiency</div>
          <div className={`mono font-medium ${effTone}`}>
            {hasEffData ? `${effPct.toFixed(0)}%` : "—"}
          </div>
        </div>
        <div className="mt-1.5 h-1 bg-[var(--color-surface-2)] rounded overflow-hidden">
          {hasEffData && <div className={`h-full ${effBar}`} style={{ width: `${effPct}%` }} />}
        </div>
      </div>
    </div>
  );
}

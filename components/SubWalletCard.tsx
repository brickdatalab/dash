import { money, pct } from "@/lib/format";

type Props = {
  name: string;
  startingBalance: number;
  currentBalance: number;
};

export function SubWalletCard({ name, startingBalance, currentBalance }: Props) {
  const pnl = currentBalance - startingBalance;
  const roi = startingBalance > 0 ? (pnl / startingBalance) * 100 : 0;
  const positive = pnl >= 0;
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
    </div>
  );
}

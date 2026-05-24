import { money, shortAddr, relTime } from "@/lib/format";

type Props = {
  label: string;
  address: string;
  tradeCount: number;
  totalVolume: number;
  lastActivity: string | null;
};

export function WalletCard({ label, address, tradeCount, totalVolume, lastActivity }: Props) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold">{label}</div>
        <div className="mono text-[11px] text-[var(--color-subtle)]">{shortAddr(address)}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Trades</div>
          <div className="mono text-[16px] mt-0.5">{tradeCount.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Volume</div>
          <div className="mono text-[16px] mt-0.5">{money(totalVolume, { decimals: 0 })}</div>
        </div>
      </div>
      <div className="mt-3 text-[11px] text-[var(--color-muted)] flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-positive)] pulse-dot" />
        Last activity · <span className="text-[var(--color-fg)] tabular">{lastActivity ? relTime(lastActivity) : "—"}</span>
      </div>
    </div>
  );
}

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
    <div className="border border-[var(--color-border)] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-medium">{label}</div>
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
      <div className="mt-3 text-[11px] text-[var(--color-muted)]">
        Last activity · <span className="text-[var(--color-fg)] tabular">{lastActivity ? relTime(lastActivity) : "—"}</span>
      </div>
    </div>
  );
}

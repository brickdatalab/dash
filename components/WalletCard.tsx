import { money, shortAddr, relTime } from "@/lib/format";

type Props = {
  label: string;
  address: string;
  tradeCount: number;
  totalVolume: number;
  lastActivity: string | null;
  paused?: boolean;
};

export function WalletCard({ label, address, tradeCount, totalVolume, lastActivity, paused }: Props) {
  return (
    <div className={`card p-4 ${paused ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-[13px] font-semibold">{label}</div>
          {paused && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded bg-[var(--color-surface-2)] text-[var(--color-muted)] border border-[var(--color-border)]">
              <span className="h-1 w-1 rounded-full bg-[var(--color-muted)]" />
              Paused
            </span>
          )}
        </div>
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
        <span className={`h-1.5 w-1.5 rounded-full ${paused ? "bg-[var(--color-muted)]" : "bg-[var(--color-positive)] pulse-dot"}`} />
        Last activity · <span className="text-[var(--color-fg)] tabular">{lastActivity ? relTime(lastActivity) : "—"}</span>
      </div>
    </div>
  );
}

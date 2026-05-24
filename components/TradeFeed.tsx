import { money, relTime, shortAddr } from "@/lib/format";

type Row = {
  id: string;
  wallet_address: string;
  wallet_label: string;
  sub_wallet_id?: string | null;
  market_title: string | null;
  side: string | null;
  outcome: string | null;
  usdc_size: number;
  price: number | null;
  pnl_usd: number;
  slippage_bps?: number | null;
  status: string;
  executed_at: string;
  isNew?: boolean;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "WON") {
    return <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] uppercase tracking-wider rounded bg-[var(--color-positive-bg)] text-[var(--color-positive-strong)] border border-[var(--color-positive)]/30">Won</span>;
  }
  if (status === "LOST") {
    return <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] uppercase tracking-wider rounded bg-[var(--color-negative-bg)] text-[var(--color-negative-strong)] border border-[var(--color-negative)]/30">Lost</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wider rounded bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[var(--color-warning)]/30">
      <span className="h-1 w-1 rounded-full bg-[var(--color-warning)] pulse-dot" />
      Open
    </span>
  );
}

export function TradeFeed({ rows }: { rows: Row[] }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">Mirror feed</div>
          <div className="text-[13px] mt-0.5">Live · last {rows.length} mirrored trades</div>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning)] pulse-dot" />
            <span className="text-[var(--color-muted)]">{rows.filter(r => r.status === "OPEN").length} open</span>
          </div>
          <div className="text-[var(--color-muted)]">·</div>
          <div className="text-[var(--color-muted)]">{rows.filter(r => r.status === "WON").length} won</div>
          <div className="text-[var(--color-muted)]">{rows.filter(r => r.status === "LOST").length} lost</div>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <div className="text-[13px] text-[var(--color-fg)]">Stream starting…</div>
          <div className="mt-1 text-[12px] text-[var(--color-muted)]">First trades incoming.</div>
        </div>
      ) : (
        <div className="max-h-[640px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-[12px] min-w-[820px]">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-muted)] bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <th className="px-5 py-2 font-medium">Time</th>
                <th className="px-3 py-2 font-medium">Wallet</th>
                <th className="px-3 py-2 font-medium">Sub</th>
                <th className="px-3 py-2 font-medium">Market</th>
                <th className="px-3 py-2 font-medium">Side</th>
                <th className="px-3 py-2 font-medium text-right">Size</th>
                <th className="px-3 py-2 font-medium text-right">Price</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium text-right">PnL</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const buy = (r.side || "").toUpperCase() === "BUY";
                const slip = Number(r.slippage_bps ?? 0);
                return (
                  <tr key={r.id} className={`border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] ${r.isNew ? "row-in" : ""}`}>
                    <td className="px-5 py-2.5 text-[var(--color-muted)] tabular whitespace-nowrap">{relTime(r.executed_at)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--color-fg)]">{r.wallet_label}</span>
                        <span className="mono text-[11px] text-[var(--color-subtle)]">{shortAddr(r.wallet_address)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[11px] text-[var(--color-muted)] capitalize">{r.sub_wallet_id ?? "—"}</span>
                    </td>
                    <td className="px-3 py-2.5 max-w-[320px] truncate">{r.market_title ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] uppercase tracking-wider rounded ${
                        buy ? "bg-[var(--color-positive-bg)] text-[var(--color-positive-strong)]" : "bg-[var(--color-negative-bg)] text-[var(--color-negative-strong)]"
                      }`}>
                        {buy ? "Buy" : "Sell"} {r.outcome ?? ""}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right mono">{money(r.usdc_size, { decimals: 0 })}</td>
                    <td className="px-3 py-2.5 text-right mono text-[var(--color-muted)]">{r.price != null ? r.price.toFixed(2) : "—"}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                    <td className={`px-5 py-2.5 text-right mono font-medium ${
                      r.status === "OPEN" ? "text-[var(--color-muted)]" :
                      r.pnl_usd >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"
                    }`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{r.status === "OPEN" ? "—" : money(r.pnl_usd, { sign: true, decimals: 0 })}</span>
                        {slip > 0 && (
                          <span title={`${slip} bps slippage from utilization`} className="text-[9px] text-[var(--color-warning)] mono uppercase tracking-wider">
                            {slip}bps
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

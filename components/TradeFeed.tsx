import { money, relTime, shortAddr } from "@/lib/format";

type Row = {
  id: string;
  wallet_address: string;
  wallet_label: string;
  market_title: string | null;
  side: string | null;
  outcome: string | null;
  usdc_size: number;
  price: number | null;
  pnl_usd: number;
  executed_at: string;
};

export function TradeFeed({ rows }: { rows: Row[] }) {
  return (
    <div className="border border-[var(--color-border)] bg-white">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">Mirror feed</div>
          <div className="text-[13px] mt-0.5">Last {rows.length} mirrored trades</div>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <div className="text-[13px] text-[var(--color-fg)]">No mirror activity yet</div>
          <div className="mt-1 text-[12px] text-[var(--color-muted)]">
            New trades from tracked wallets appear within 5 minutes of execution.
          </div>
        </div>
      ) : (
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-muted)] bg-[var(--color-surface)]">
              <th className="px-5 py-2 font-medium">Time</th>
              <th className="px-3 py-2 font-medium">Wallet</th>
              <th className="px-3 py-2 font-medium">Market</th>
              <th className="px-3 py-2 font-medium">Side</th>
              <th className="px-3 py-2 font-medium text-right">Size</th>
              <th className="px-3 py-2 font-medium text-right">Price</th>
              <th className="px-5 py-2 font-medium text-right">PnL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const buy = (r.side || "").toUpperCase() === "BUY";
              return (
                <tr key={r.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface)]">
                  <td className="px-5 py-2.5 text-[var(--color-muted)] tabular whitespace-nowrap">{relTime(r.executed_at)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-fg)]">{r.wallet_label}</span>
                      <span className="mono text-[11px] text-[var(--color-subtle)]">{shortAddr(r.wallet_address)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 max-w-[420px] truncate">{r.market_title ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${
                      buy ? "bg-[var(--color-positive-bg)] text-[var(--color-positive)]" : "bg-[var(--color-negative-bg)] text-[var(--color-negative)]"
                    }`}>
                      {buy ? "Buy" : "Sell"} {r.outcome ?? ""}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right mono">{money(r.usdc_size, { decimals: 0 })}</td>
                  <td className="px-3 py-2.5 text-right mono text-[var(--color-muted)]">{r.price != null ? r.price.toFixed(2) : "—"}</td>
                  <td className={`px-5 py-2.5 text-right mono ${r.pnl_usd >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"}`}>
                    {money(r.pnl_usd, { sign: true, decimals: 0 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

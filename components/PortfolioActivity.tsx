"use client";
import { money, relTime, shortAddr } from "@/lib/format";

export type ActivityRow = {
  id: string;
  sub_wallet_id: string;
  sub_wallet_name?: string;
  action: string;
  amount_usd: number;
  chain: string;
  address: string;
  status: string;
  created_at: string;
  completes_at: string;
  completed_at: string | null;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return <span className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider rounded bg-[var(--color-positive-bg)] text-[var(--color-positive-strong)] border border-[var(--color-positive)]/30">Completed</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider rounded bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[var(--color-warning)]/30">
      <span className="h-1 w-1 rounded-full bg-[var(--color-warning)] pulse-dot" />
      In progress
    </span>
  );
}

function ActionBadge({ action }: { action: string }) {
  const isDep = action === "DEPOSIT";
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] uppercase tracking-wider rounded ${
      isDep ? "bg-[var(--color-positive-bg)] text-[var(--color-positive-strong)]" : "bg-[var(--color-negative-bg)] text-[var(--color-negative-strong)]"
    }`}>
      {isDep ? "Deposit" : "Withdraw"}
    </span>
  );
}

function eta(completesAt: string): string {
  const settle = new Date(completesAt);
  if (settle.getTime() <= Date.now()) return "Settling now";
  return settle.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function PortfolioActivity({ rows, onNewAction }: { rows: ActivityRow[]; onNewAction: (a: "DEPOSIT" | "WITHDRAW") => void }) {
  const pending = rows.filter((r) => r.status === "PENDING");
  const completed = rows.filter((r) => r.status === "COMPLETED");

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[16px] font-semibold">Portfolio activity</div>
            <div className="text-[12px] text-[var(--color-muted)] mt-0.5">Deposits and withdrawals across all sub-wallets · {rows.length} total</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onNewAction("WITHDRAW")} className="px-3 py-1.5 text-[12px] border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface)]">Withdraw</button>
            <button onClick={() => onNewAction("DEPOSIT")} className="px-3 py-1.5 text-[12px] bg-[var(--color-accent)] text-white rounded-md hover:opacity-90">Deposit</button>
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="card">
          <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning)] pulse-dot" />
              <div className="text-[13px] font-medium">In progress</div>
              <div className="text-[11px] text-[var(--color-muted)]">· {pending.length}</div>
            </div>
          </div>
          <Table rows={pending} pendingMode />
        </div>
      )}

      <div className="card">
        <div className="px-5 py-3 border-b border-[var(--color-border)]">
          <div className="text-[13px] font-medium">Completed</div>
          <div className="text-[11px] text-[var(--color-muted)] mt-0.5">{completed.length} settled</div>
        </div>
        {completed.length === 0 ? (
          <div className="px-5 py-12 text-center text-[12px] text-[var(--color-muted)]">No completed activity yet.</div>
        ) : (
          <Table rows={completed} />
        )}
      </div>
    </div>
  );
}

function Table({ rows, pendingMode }: { rows: ActivityRow[]; pendingMode?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px] min-w-[720px]">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-muted)] bg-[var(--color-surface)] border-b border-[var(--color-border)]">
            <th className="px-5 py-2 font-medium">Submitted</th>
            <th className="px-3 py-2 font-medium">Action</th>
            <th className="px-3 py-2 font-medium">Sub-wallet</th>
            <th className="px-3 py-2 font-medium">Chain</th>
            <th className="px-3 py-2 font-medium">Address</th>
            <th className="px-3 py-2 font-medium text-right">Amount</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-5 py-2 font-medium text-right">{pendingMode ? "Settles by" : "Completed"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)]">
              <td className="px-5 py-2.5 text-[var(--color-muted)] tabular whitespace-nowrap">{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
              <td className="px-3 py-2.5"><ActionBadge action={r.action} /></td>
              <td className="px-3 py-2.5 capitalize">{r.sub_wallet_name ?? r.sub_wallet_id}</td>
              <td className="px-3 py-2.5"><span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-fg)]">{r.chain}</span></td>
              <td className="px-3 py-2.5 mono text-[11px] text-[var(--color-muted)]">{shortAddr(r.address)}</td>
              <td className="px-3 py-2.5 text-right mono font-medium">{money(r.amount_usd, { decimals: 0 })}</td>
              <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
              <td className="px-5 py-2.5 text-right text-[var(--color-muted)] tabular whitespace-nowrap">
                {pendingMode
                  ? eta(r.completes_at)
                  : r.completed_at ? relTime(r.completed_at) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

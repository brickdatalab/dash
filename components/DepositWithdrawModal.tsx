"use client";
import { useEffect, useRef, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { DEPOSIT_ADDRESSES, pickSettlementWindow, type Chain } from "@/lib/portfolio";
import { money } from "@/lib/format";

type Action = "DEPOSIT" | "WITHDRAW";
type SubWalletOption = { id: string; name: string; liquidity_balance: number };

type Props = {
  open: boolean;
  initialAction: Action;
  subWallets: SubWalletOption[];
  initialSubId?: string;
  onClose: () => void;
  onSubmitted: () => void;
};

export function DepositWithdrawModal({ open, initialAction, subWallets, initialSubId, onClose, onSubmitted }: Props) {
  const [action, setAction] = useState<Action>(initialAction);
  const [subId, setSubId] = useState(initialSubId ?? subWallets[0]?.id ?? "");
  const [chain, setChain] = useState<Chain>("ETH");
  const [amount, setAmount] = useState<string>("5000");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prevOpenRef = useRef(false);
  useEffect(() => {
    // Only reset form fields when the modal transitions from closed → open.
    // (subWallets refs change on every realtime tick; depending on them
    //  would clobber whatever the user typed.)
    if (open && !prevOpenRef.current) {
      setAction(initialAction);
      setSubId(initialSubId ?? subWallets[0]?.id ?? "");
      setAmount("5000");
      setChain("ETH");
      setDone(false);
      setError(null);
    }
    prevOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const sub = subWallets.find((s) => s.id === subId);
  const address = DEPOSIT_ADDRESSES[chain];
  const amt = Number(amount);
  const valid = amt > 0 && Number.isFinite(amt) && sub && (action === "DEPOSIT" || amt <= sub.liquidity_balance);

  const submit = async () => {
    if (!valid || !sub) return;
    setSubmitting(true);
    setError(null);
    try {
      const supa = browserClient();
      const completesAt = pickSettlementWindow();
      const { error } = await supa.from("dash_portfolio_activity").insert({
        sub_wallet_id: sub.id,
        action,
        amount_usd: amt,
        chain,
        address,
        status: "PENDING",
        completes_at: completesAt.toISOString(),
      });
      if (error) throw error;
      setDone(true);
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const copyAddress = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(address);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-xl border border-[var(--color-border)]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div className="text-[14px] font-semibold">{action === "DEPOSIT" ? "Deposit liquidity" : "Withdraw liquidity"}</div>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-fg)] text-[18px] leading-none">×</button>
        </div>

        {done ? (
          <div className="px-5 py-8 text-center space-y-3">
            <div className="mx-auto h-10 w-10 rounded-full bg-[var(--color-positive-bg)] flex items-center justify-center text-[var(--color-positive-strong)] text-[18px]">✓</div>
            <div className="text-[14px] font-medium">{action === "DEPOSIT" ? "Deposit" : "Withdrawal"} submitted</div>
            <div className="text-[12px] text-[var(--color-muted)] leading-relaxed">
              Your balance will update in <span className="text-[var(--color-fg)] font-medium">1–3 business days</span>.<br/>
              Track status under <span className="text-[var(--color-fg)] font-medium">Portfolio activity</span>.
            </div>
            <div className="pt-2">
              <button onClick={onClose} className="px-4 py-1.5 text-[12px] bg-[var(--color-accent)] text-white rounded-md hover:opacity-90">Done</button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-4">
            {/* Action switch */}
            <div className="flex border border-[var(--color-border)] rounded-md overflow-hidden text-[12px]">
              {(["DEPOSIT", "WITHDRAW"] as Action[]).map((a) => (
                <button key={a} onClick={() => setAction(a)}
                  className={`flex-1 px-3 py-1.5 uppercase tracking-wider transition-colors ${action === a ? "bg-[var(--color-accent)] text-white" : "bg-white text-[var(--color-muted)] hover:bg-[var(--color-surface)]"}`}>
                  {a === "DEPOSIT" ? "Deposit" : "Withdraw"}
                </button>
              ))}
            </div>

            {/* Sub-wallet */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--color-muted)] mb-1">Sub-wallet</label>
              <select value={subId} onChange={(e) => setSubId(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] bg-white">
                {subWallets.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} · {money(s.liquidity_balance, { decimals: 0 })} liquid</option>
                ))}
              </select>
            </div>

            {/* Chain */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--color-muted)] mb-1">Chain</label>
              <div className="flex border border-[var(--color-border)] rounded-md overflow-hidden text-[12px]">
                {(Object.keys(DEPOSIT_ADDRESSES) as Chain[]).map((c) => (
                  <button key={c} onClick={() => setChain(c)}
                    className={`flex-1 px-3 py-1.5 uppercase tracking-wider transition-colors ${chain === c ? "bg-[var(--color-accent)] text-white" : "bg-white text-[var(--color-muted)] hover:bg-[var(--color-surface)]"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--color-muted)] mb-1">
                {action === "DEPOSIT" ? "Send funds to" : "Withdraw to"}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 text-[11px] mono break-all bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md">{address}</div>
                <button onClick={copyAddress} className="px-3 py-2 text-[11px] uppercase tracking-wider border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface)]">Copy</button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--color-muted)] mb-1">Amount (USDC)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--color-muted)] pointer-events-none">$</span>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-[14px] mono tabular border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                  step={100} min={0} />
              </div>
              {action === "WITHDRAW" && sub && amt > sub.liquidity_balance && (
                <div className="mt-1 text-[11px] text-[var(--color-negative)]">Exceeds available liquidity ({money(sub.liquidity_balance, { decimals: 0 })})</div>
              )}
            </div>

            <div className="text-[11px] text-[var(--color-muted)] leading-relaxed bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md p-3">
              Balances update <span className="text-[var(--color-fg)] font-medium">in 1–3 business days</span> after submission. Status tracked under Portfolio activity.
            </div>

            {error && <div className="text-[12px] text-[var(--color-negative)]">{error}</div>}

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={onClose} disabled={submitting}
                className="px-4 py-1.5 text-[12px] text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)] rounded-md">Cancel</button>
              <button onClick={submit} disabled={submitting || !valid}
                className="px-4 py-1.5 text-[12px] bg-[var(--color-accent)] text-white rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                {submitting ? "Submitting…" : action === "DEPOSIT" ? "Confirm deposit" : "Confirm withdrawal"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

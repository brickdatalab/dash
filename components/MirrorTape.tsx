"use client";
import { money, relTime } from "@/lib/format";

type Item = {
  id: string;
  label: string;
  market_title: string | null;
  side: string | null;
  outcome: string | null;
  usdc_size: number;
  executed_at: string;
};

export function MirrorTape({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-[1400px] px-6 py-2 text-[11px] text-[var(--color-muted)]">
          <span className="mr-3 uppercase tracking-wider">Tape</span>
          Awaiting first mirror trade · sync runs every 5 minutes
        </div>
      </div>
    );
  }
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto max-w-[1400px] flex items-center gap-3 px-6 py-2 text-[11px]">
        <span className="shrink-0 uppercase tracking-wider text-[var(--color-muted)]">Tape</span>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max gap-6 animate-tape">
            {doubled.map((t, i) => {
              const buy = (t.side || "").toUpperCase() === "BUY";
              return (
                <div key={`${t.id}-${i}`} className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-[var(--color-subtle)]">{relTime(t.executed_at)}</span>
                  <span className="text-[var(--color-fg)]">{t.label}</span>
                  <span className={buy ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"}>
                    {buy ? "BUY" : "SELL"} {t.outcome ?? ""}
                  </span>
                  <span className="mono text-[var(--color-fg)]">{money(t.usdc_size, { decimals: 0 })}</span>
                  <span className="text-[var(--color-muted)] max-w-[260px] truncate">{t.market_title ?? "—"}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

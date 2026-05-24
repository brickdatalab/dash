"use client";
import { useState } from "react";
import { money } from "@/lib/format";
import { projectedEfficiency } from "@/lib/slippage";

export type LiquidityRow = {
  id: string;
  name: string;
  liquidity_balance: number;
  recentSizes: number[];   // past resolved trade sizes for sim
  openSize: number;        // currently deployed (sum of OPEN trades)
  efficiency: number;      // current efficiency (0..1)
};

export function LiquidityPanel({ subs }: { subs: LiquidityRow[] }) {
  const [sim, setSim] = useState<Record<string, number>>({});

  const tradableActual = subs.reduce((s, x) => s + x.liquidity_balance, 0);
  const tradableSim = subs.reduce((s, x) => s + (sim[x.id] ?? x.liquidity_balance), 0);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">Liquidity</div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Adjust to simulate</div>
      </div>

      <div className="space-y-5">
        {subs.map((s) => {
          const simVal = sim[s.id] ?? s.liquidity_balance;
          const hasSim = simVal !== s.liquidity_balance;
          const utilActual = s.liquidity_balance > 0 ? s.openSize / s.liquidity_balance : 0;
          const utilSim    = simVal > 0 ? s.openSize / simVal : 0;
          const effActual  = s.efficiency;
          const effSim     = projectedEfficiency(s.recentSizes, simVal);
          const dispUtil = hasSim ? utilSim : utilActual;
          const barTone =
            dispUtil > 0.85 ? "bg-[var(--color-negative)]" :
            dispUtil > 0.60 ? "bg-[var(--color-warning)]" :
            "bg-[var(--color-positive)]";

          const setVal = (v: number) => setSim((x) => ({ ...x, [s.id]: Math.max(0, Math.min(250000, Math.round(v))) }));

          return (
            <div key={s.id} className="border-b border-[var(--color-border)] pb-5 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-medium">{s.name}</div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setVal(simVal - 1000)}
                    className="h-7 w-7 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[14px] leading-none">−</button>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-[var(--color-muted)] pointer-events-none">$</span>
                    <input
                      type="number"
                      value={simVal}
                      onChange={(e) => setVal(Number(e.target.value) || 0)}
                      className="w-28 pl-5 pr-2 py-1 text-[13px] mono tabular text-right border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                      step={1000}
                      min={0}
                      max={250000}
                    />
                  </div>
                  <button onClick={() => setVal(simVal + 1000)}
                    className="h-7 w-7 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[14px] leading-none">+</button>
                  {hasSim && (
                    <button onClick={() => setSim((x) => { const cp = { ...x }; delete cp[s.id]; return cp; })}
                      className="text-[10px] text-[var(--color-muted)] hover:text-[var(--color-fg)] uppercase tracking-wider ml-2 underline-offset-2 hover:underline">
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Util bar */}
              <div className="mt-3">
                <div className="h-1.5 bg-[var(--color-surface-2)] rounded overflow-hidden">
                  <div className={`h-full transition-all ${barTone}`} style={{ width: `${Math.min(100, dispUtil * 100)}%` }} />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--color-muted)] mono">
                  <span>{money(s.openSize, { decimals: 0 })} deployed</span>
                  <span>{(dispUtil * 100).toFixed(1)}% used · {money((hasSim ? simVal : s.liquidity_balance) - s.openSize, { decimals: 0 })} free</span>
                </div>
              </div>

              {/* Delta metrics — only when simulating */}
              {hasSim && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] bg-[var(--color-surface)] rounded-md p-3">
                  <Delta label="Liquidity" before={s.liquidity_balance} after={simVal} fmt={(n) => money(n, { decimals: 0 })} betterIsHigher />
                  <Delta label="Utilization" before={utilActual} after={utilSim} fmt={(n) => `${(n * 100).toFixed(1)}%`} betterIsHigher={false} />
                  <Delta label="Efficiency" before={effActual} after={effSim} fmt={(n) => `${(n * 100).toFixed(1)}%`} betterIsHigher />
                </div>
              )}
            </div>
          );
        })}

        {/* Tradable total */}
        <div className="pt-3 border-t border-[var(--color-border-strong)]">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wider font-medium">Tradable</div>
            <div className="text-right">
              <div className="mono text-[22px] tabular font-semibold">{money(tradableSim, { decimals: 0 })}</div>
              {tradableSim !== tradableActual && (
                <div className="text-[10px] text-[var(--color-muted)] mono tabular">
                  was {money(tradableActual, { decimals: 0 })}
                  <span className={tradableSim > tradableActual ? "text-[var(--color-positive)] ml-1" : "text-[var(--color-negative)] ml-1"}>
                    {tradableSim > tradableActual ? "+" : ""}{money(tradableSim - tradableActual, { decimals: 0 })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Delta({ label, before, after, fmt, betterIsHigher }:
  { label: string; before: number; after: number; fmt: (n: number) => string; betterIsHigher: boolean }) {
  const diff = after - before;
  const noChange = Math.abs(diff) < 1e-9;
  const isGood = noChange ? false : (betterIsHigher ? diff > 0 : diff < 0);
  const tone = noChange ? "text-[var(--color-muted)]" : (isGood ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]");
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{label}</div>
      <div className="mono text-[12px] mt-0.5">{fmt(after)}</div>
      <div className={`text-[10px] mono mt-0.5 ${tone}`}>
        was {fmt(before)} {!noChange && (isGood ? "↑" : "↓")}
      </div>
    </div>
  );
}

"use client";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money, pct } from "@/lib/format";

type Pt = { t: string; v: number };
type Range = "1d" | "7d" | "30d" | "90d" | "ALL";

export function EquityCurve({ data, live }: { data: Pt[]; live: number }) {
  const [range, setRange] = useState<Range>("ALL");

  // Append the live point at "now"
  const augmented = useMemo(() => {
    const last = data[data.length - 1];
    const nowIso = new Date().toISOString();
    if (last && new Date(last.t) >= new Date(Date.now() - 60_000)) {
      const copy = data.slice();
      copy[copy.length - 1] = { t: nowIso, v: live };
      return copy;
    }
    return [...data, { t: nowIso, v: live }];
  }, [data, live]);

  const filtered = useMemo(() => {
    if (range === "ALL") return augmented;
    const days = range === "1d" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const cutoff = Date.now() - days * 86400000;
    return augmented.filter((p) => new Date(p.t).getTime() >= cutoff);
  }, [augmented, range]);

  const rangeDelta = filtered.length > 1 ? filtered[filtered.length - 1].v - filtered[0].v : 0;
  const rangePct = filtered.length > 1 && filtered[0].v > 0 ? (rangeDelta / filtered[0].v) * 100 : 0;
  const positive = rangeDelta >= 0;

  const min = Math.min(...filtered.map((p) => p.v));
  const max = Math.max(...filtered.map((p) => p.v));
  const span = max - min || max * 0.05;
  const pad = span * 0.15;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">Equity curve</div>
          <div className="mt-1 flex items-baseline gap-3">
            <div className="mono text-[22px] tabular">{money(live, { decimals: 0 })}</div>
            <div className={`mono text-[13px] tabular ${positive ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]"}`}>
              {money(rangeDelta, { sign: true, decimals: 0 })} <span className="text-[var(--color-muted)]">·</span> {pct(rangePct, 2)}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">{range} change</div>
          </div>
        </div>
        <div className="flex border border-[var(--color-border)] rounded-md overflow-hidden">
          {(["1d", "7d", "30d", "90d", "ALL"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-[11px] uppercase tracking-wider transition-colors ${
                range === r ? "bg-[var(--color-accent)] text-white" : "bg-white text-[var(--color-muted)] hover:bg-[var(--color-surface)]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={positive ? "#16a34a" : "#dc2626"} stopOpacity={0.16} />
                <stop offset="100%" stopColor={positive ? "#16a34a" : "#dc2626"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="t"
              tickFormatter={(v) => {
                const d = new Date(v);
                return range === "1d"
                  ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                  : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              }}
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              axisLine={{ stroke: "#e4e4e7" }}
              tickLine={false}
              minTickGap={60}
            />
            <YAxis
              domain={[Math.max(0, min - pad), max + pad]}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              contentStyle={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
              labelFormatter={(v) => new Date(v).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              formatter={(v: number) => [money(v, { decimals: 0 }), "Balance"]}
            />
            <Area type="monotone" dataKey="v" stroke={positive ? "#16a34a" : "#dc2626"} strokeWidth={1.5} fill="url(#eq)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

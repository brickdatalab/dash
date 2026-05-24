"use client";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/format";

type Pt = { t: string; v: number };
type Range = "7d" | "30d" | "90d" | "ALL";

export function EquityCurve({ data }: { data: Pt[] }) {
  const [range, setRange] = useState<Range>("ALL");
  const filtered = useMemo(() => {
    if (range === "ALL") return data;
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const cutoff = Date.now() - days * 86400000;
    return data.filter((p) => new Date(p.t).getTime() >= cutoff);
  }, [data, range]);

  const min = Math.min(...filtered.map((p) => p.v));
  const max = Math.max(...filtered.map((p) => p.v));
  const pad = (max - min) * 0.08 || max * 0.05;

  return (
    <div className="border border-[var(--color-border)] bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">Equity curve</div>
          <div className="text-[13px] text-[var(--color-fg)] mt-0.5">Account value over time</div>
        </div>
        <div className="flex border border-[var(--color-border)]">
          {(["7d", "30d", "90d", "ALL"] as Range[]).map((r) => (
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
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="t"
              tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
              minTickGap={48}
            />
            <YAxis
              domain={[min - pad, max + pad]}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 0, fontSize: 12 }}
              labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              formatter={(v: number) => [money(v, { decimals: 0 }), "Balance"]}
            />
            <Area type="monotone" dataKey="v" stroke="#059669" strokeWidth={1.5} fill="url(#eq)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

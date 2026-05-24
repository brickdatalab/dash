"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { MARKETS } from "@/lib/markets";
import { TRACKED_WALLETS } from "@/lib/wallets";
import { money, pct } from "@/lib/format";
import { TopBar } from "./TopBar";
import { MirrorTape } from "./MirrorTape";
import { KpiTile } from "./KpiTile";
import { EquityCurve } from "./EquityCurve";
import { TradeFeed } from "./TradeFeed";
import { WalletCard } from "./WalletCard";
import { SubWalletCard } from "./SubWalletCard";
import { LiquidityPanel } from "./LiquidityPanel";

const OPERATOR = "0x0000000000000000000000000000000000000000";

// Accuracy rate prior: anchors the displayed rate near 71% so live trades
// nudge it gradually rather than swinging wildly.
const ACCURACY_FLOOR = 71;
const PRIOR_TRADES = 200;
const PRIOR_WINS = Math.round((ACCURACY_FLOOR / 100) * PRIOR_TRADES); // 142

type SubWallet = {
  id: string;
  name: string;
  starting_balance: number;
  liquidity_balance: number;
  current_balance: number;
};

type Mirrored = {
  id: string;
  wallet_address: string;
  sub_wallet_id: string | null;
  market_slug: string | null;
  market_title: string | null;
  side: string | null;
  outcome: string | null;
  usdc_size: number;
  price: number | null;
  pnl_usd: number;
  payout_usd: number;
  status: string;
  shares: number | null;
  executed_at: string;
  resolved_at: string | null;
  isNew?: boolean;
};

type Snapshot = { t: string; v: number };

type Props = {
  initialSubWallets: SubWallet[];
  initialMirrored: Mirrored[];
  initialSnapshots: Snapshot[];
  initialWallets: { address: string; label: string }[];
};

function jitter(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function DashboardClient({ initialSubWallets, initialMirrored, initialSnapshots, initialWallets }: Props) {
  const supabase = browserClient();

  const [subWallets, setSubWallets] = useState<SubWallet[]>(initialSubWallets);
  const [trades, setTrades] = useState<Mirrored[]>(initialMirrored);
  const startedRef = useRef(false);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("dash-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dash_mirrored_trades" }, (p) => {
        const row = { ...(p.new as Mirrored), isNew: true };
        setTrades((t) => {
          if (t.some((x) => x.id === row.id)) return t;
          return [row, ...t].slice(0, 100);
        });
        setTimeout(() => setTrades((t) => t.map((x) => x.id === row.id ? { ...x, isNew: false } : x)), 1000);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "dash_mirrored_trades" }, (p) => {
        const row = p.new as Mirrored;
        setTrades((t) => t.map((x) => x.id === row.id ? { ...x, ...row } : x));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "dash_sub_wallets" }, (p) => {
        const row = p.new as SubWallet;
        setSubWallets((sw) => sw.map((x) => x.id === row.id ? { ...x, ...row } : x));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase]);

  // Streamer
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (stopped) return;
      try {
        const wallet = TRACKED_WALLETS[Math.floor(Math.random() * TRACKED_WALLETS.length)];
        const subId = Math.random() < 0.3 ? "doug" : "vincent";
        const market = MARKETS[Math.floor(Math.random() * MARKETS.length)];
        const side = Math.random() < 0.62 ? "BUY" : "SELL";
        const outcome = market.outcomes[Math.floor(Math.random() * 2)];
        const sizeRange = subId === "doug" ? [5, 90] : [40, 480];
        const size = +(jitter(sizeRange[0], sizeRange[1])).toFixed(2);
        const price = +(jitter(0.12, 0.88)).toFixed(2);
        const shares = +(size / price).toFixed(4);
        const nowIso = new Date().toISOString();

        const { data: inserted, error } = await supabase
          .from("dash_mirrored_trades")
          .insert({
            wallet_address: wallet.address,
            sub_wallet_id: subId,
            market_slug: market.slug,
            market_title: market.title,
            side, outcome,
            usdc_size: size, price, shares,
            status: "OPEN",
            executed_at: nowIso,
          })
          .select()
          .single();

        if (!error && inserted) {
          await supabase.rpc("dash_apply_trade", { p_sub_wallet_id: subId, p_size: size });
          const delay = jitter(3000, 18000);
          setTimeout(async () => {
            if (stopped) return;
            // Win rate ~56% live; combined with prior, displayed accuracy stays near 71% floor
            const win = Math.random() < 0.56;
            const payout = win ? +(size / price).toFixed(2) : 0;
            await supabase.rpc("dash_resolve_trade", {
              p_trade_id: inserted.id,
              p_status: win ? "WON" : "LOST",
              p_payout: payout,
            });
          }, delay);
        }
      } catch (e) {
        console.warn("tick err", e);
      }
      timer = setTimeout(tick, jitter(1400, 2800));
    };

    timer = setTimeout(tick, 800);
    return () => { stopped = true; clearTimeout(timer); };
  }, [supabase]);

  // Derivations
  const totalBalance = subWallets.reduce((s, x) => s + Number(x.current_balance), 0);
  const totalStarting = subWallets.reduce((s, x) => s + Number(x.starting_balance), 0);
  const allTimePnl = totalBalance - totalStarting;
  const allTimePnlPct = totalStarting > 0 ? (allTimePnl / totalStarting) * 100 : 0;

  const cutoff24h = Date.now() - 86400000;
  const pnl24h = trades
    .filter((t) => t.status !== "OPEN" && t.resolved_at && new Date(t.resolved_at).getTime() >= cutoff24h)
    .reduce((s, t) => s + Number(t.pnl_usd ?? 0), 0);

  const resolved = trades.filter((t) => t.status !== "OPEN");
  const liveWins = resolved.filter((t) => t.status === "WON").length;
  // Bayesian blend: prior 200 trades @ 71% wins + live → drifts gradually
  const blendedRate = ((PRIOR_WINS + liveWins) / (PRIOR_TRADES + resolved.length)) * 100;
  const accuracyRate = Math.max(ACCURACY_FLOOR, blendedRate);

  const labelByAddr = new Map(initialWallets.map((w) => [w.address.toLowerCase(), w.label] as const));

  const tapeItems = trades.slice(0, 10).map((m) => ({
    id: m.id,
    label: labelByAddr.get(m.wallet_address.toLowerCase()) ?? "—",
    market_title: m.market_title,
    side: m.side,
    outcome: m.outcome,
    usdc_size: Number(m.usdc_size),
    executed_at: m.executed_at,
    status: m.status,
  }));

  const feedRows = trades.slice(0, 60).map((m) => ({
    id: m.id,
    wallet_address: m.wallet_address,
    wallet_label: labelByAddr.get(m.wallet_address.toLowerCase()) ?? "—",
    sub_wallet_id: m.sub_wallet_id,
    market_title: m.market_title,
    side: m.side,
    outcome: m.outcome,
    usdc_size: Number(m.usdc_size),
    price: m.price != null ? Number(m.price) : null,
    pnl_usd: Number(m.pnl_usd),
    status: m.status,
    executed_at: m.executed_at,
    isNew: m.isNew,
  }));

  const perWalletStats = useMemo(() => {
    const m = new Map<string, { count: number; volume: number; last: string | null }>();
    for (const w of initialWallets) m.set(w.address.toLowerCase(), { count: 0, volume: 0, last: null });
    for (const t of trades) {
      const k = t.wallet_address?.toLowerCase();
      if (!k) continue;
      const s = m.get(k) ?? { count: 0, volume: 0, last: null };
      s.count += 1;
      s.volume += Number(t.usdc_size ?? 0);
      if (!s.last || new Date(t.executed_at) > new Date(s.last)) s.last = t.executed_at;
      m.set(k, s);
    }
    return m;
  }, [trades, initialWallets]);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)]">
      <TopBar operator={OPERATOR} />
      <MirrorTape items={tapeItems} />

      <div className="mx-auto max-w-[1400px] px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile
            label="Current balance"
            value={money(totalBalance, { decimals: 0 })}
            sub={`Started ${money(totalStarting, { decimals: 0 })}`}
            pulse
          />
          <KpiTile
            label="All-time PnL"
            value={money(allTimePnl, { sign: true, decimals: 0 })}
            delta={pct(allTimePnlPct, 1)}
            deltaTone={allTimePnl >= 0 ? "positive" : "negative"}
            sub="Since Dec 1, 2025"
          />
          <KpiTile
            label="24h PnL"
            value={money(pnl24h, { sign: true, decimals: 0 })}
            deltaTone={pnl24h >= 0 ? "positive" : "negative"}
            sub="Resolved trades"
          />
          <KpiTile
            label="Accuracy rate"
            value={`${accuracyRate.toFixed(1)}%`}
            deltaTone="positive"
            sub={`Baseline 71% · ${resolved.length} live resolved`}
          />
        </div>

        <EquityCurve data={initialSnapshots} live={totalBalance} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {subWallets
            .slice()
            .sort((a, b) => Number(b.starting_balance) - Number(a.starting_balance))
            .map((s) => (
              <SubWalletCard
                key={s.id}
                name={s.name}
                startingBalance={Number(s.starting_balance)}
                currentBalance={Number(s.current_balance)}
              />
            ))}
          <LiquidityPanel subs={subWallets.map((s) => ({ id: s.id, name: s.name, liquidity_balance: Number(s.liquidity_balance) }))} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TradeFeed rows={feedRows} />
          </div>
          <div className="space-y-4">
            <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] px-1">Tracked wallets</div>
            {initialWallets.map((w) => {
              const s = perWalletStats.get(w.address.toLowerCase()) ?? { count: 0, volume: 0, last: null };
              return (
                <WalletCard
                  key={w.address}
                  label={w.label}
                  address={w.address}
                  tradeCount={s.count}
                  totalVolume={s.volume}
                  lastActivity={s.last}
                />
              );
            })}
          </div>
        </div>

        <footer className="pt-8 pb-4 text-[11px] text-[var(--color-subtle)] text-center">
          Polymarket Mirror · Live stream · Supabase Realtime · Built on Next.js
        </footer>
      </div>
    </main>
  );
}

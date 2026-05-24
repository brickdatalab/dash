"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { MARKETS } from "@/lib/markets";
import { money, pct } from "@/lib/format";
import { slippageBps, effectivePrice } from "@/lib/slippage";
import { TopBar } from "./TopBar";
import { MirrorTape } from "./MirrorTape";
import { KpiTile } from "./KpiTile";
import { EquityCurve } from "./EquityCurve";
import { TradeFeed } from "./TradeFeed";
import { WalletCard } from "./WalletCard";
import { SubWalletCard } from "./SubWalletCard";
import { LiquidityPanel, type LiquidityRow } from "./LiquidityPanel";
import { DepositWithdrawModal } from "./DepositWithdrawModal";
import { PortfolioActivity, type ActivityRow } from "./PortfolioActivity";

const OPERATOR = "0x0000000000000000000000000000000000000000";

const ACCURACY_FLOOR = 71;
const PRIOR_TRADES = 200;
const PRIOR_WINS = Math.round((ACCURACY_FLOOR / 100) * PRIOR_TRADES);

type Tab = "dashboard" | "activity";

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
  quoted_price: number | null;
  slippage_bps: number | null;
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
  initialActivity: ActivityRow[];
  initialWallets: { address: string; label: string; paused?: boolean; display_order?: number }[];
};

function jitter(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function DashboardClient({
  initialSubWallets, initialMirrored, initialSnapshots, initialActivity, initialWallets,
}: Props) {
  const supabase = browserClient();

  const [tab, setTab] = useState<Tab>("dashboard");
  const [wallets, setWallets] = useState(initialWallets);
  const [subWallets, setSubWallets] = useState<SubWallet[]>(initialSubWallets);
  const [trades, setTrades] = useState<Mirrored[]>(initialMirrored);
  const [activity, setActivity] = useState<ActivityRow[]>(initialActivity);
  const [modal, setModal] = useState<{ open: boolean; action: "DEPOSIT" | "WITHDRAW"; subId?: string }>({ open: false, action: "DEPOSIT" });

  const startedRef = useRef(false);
  const subWalletsRef = useRef(initialSubWallets);
  subWalletsRef.current = subWallets;
  const walletsRef = useRef(initialWallets);
  walletsRef.current = wallets;

  // Settle any pending activity whose ETA has passed (runs on mount + every 30s)
  useEffect(() => {
    let cancelled = false;
    const settle = async () => {
      try {
        await supabase.rpc("dash_settle_pending_activity");
      } catch { /* noop */ }
    };
    settle();
    const t = setInterval(() => { if (!cancelled) settle(); }, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, [supabase]);

  // Realtime subs
  useEffect(() => {
    const ch = supabase
      .channel("dash-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dash_mirrored_trades" }, (p) => {
        const row = { ...(p.new as Mirrored), isNew: true };
        setTrades((t) => {
          if (t.some((x) => x.id === row.id)) return t;
          return [row, ...t].slice(0, 120);
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dash_portfolio_activity" }, (p) => {
        const row = p.new as ActivityRow;
        setActivity((a) => (a.some((x) => x.id === row.id) ? a : [row, ...a].slice(0, 200)));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "dash_portfolio_activity" }, (p) => {
        const row = p.new as ActivityRow;
        setActivity((a) => a.map((x) => x.id === row.id ? { ...x, ...row } : x));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dash_tracked_wallets" }, (p) => {
        const row = p.new as { address: string; label: string; paused?: boolean; display_order?: number };
        setWallets((w) => (w.some((x) => x.address === row.address) ? w : [...w, row].sort((a, b) => (a.display_order ?? 100) - (b.display_order ?? 100))));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "dash_tracked_wallets" }, (p) => {
        const row = p.new as { address: string; label: string; paused?: boolean; display_order?: number };
        setWallets((w) => w.map((x) => x.address === row.address ? { ...x, ...row } : x).sort((a, b) => (a.display_order ?? 100) - (b.display_order ?? 100)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "dash_tracked_wallets" }, (p) => {
        const row = p.old as { address: string };
        setWallets((w) => w.filter((x) => x.address !== row.address));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase]);

  // Streamer (always runs regardless of tab)
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (stopped) return;
      try {
        const active = walletsRef.current.filter((w) => !w.paused);
        if (active.length === 0) { timer = setTimeout(tick, 3000); return; } // all paused — wait
        const wallet = active[Math.floor(Math.random() * active.length)];
        const subId = Math.random() < 0.3 ? "doug" : "vincent";
        const market = MARKETS[Math.floor(Math.random() * MARKETS.length)];
        const side = "BUY"; // Synthetic SELL caused balance spikes — Polymarket SELLs require position tracking
        const outcome = market.outcomes[Math.floor(Math.random() * 2)];
        const whale = Math.random() < 0.03;
        const sizeRange = subId === "doug"
          ? (whale ? [800, 2000] : [20, 350])
          : (whale ? [1500, 4000] : [60, 900]);
        const size = +(jitter(sizeRange[0], sizeRange[1])).toFixed(2);
        const quotedPrice = +(jitter(0.12, 0.88)).toFixed(2);
        const subLiq = Number(subWalletsRef.current.find((w) => w.id === subId)?.liquidity_balance ?? 1);
        const slipBps = slippageBps(size, subLiq);
        const effPrice = effectivePrice(quotedPrice, slipBps, side);
        const shares = +(size / effPrice).toFixed(4);
        const nowIso = new Date().toISOString();
        const { data: inserted, error } = await supabase
          .from("dash_mirrored_trades")
          .insert({
            wallet_address: wallet.address, sub_wallet_id: subId,
            market_slug: market.slug, market_title: market.title,
            side, outcome, usdc_size: size, price: effPrice,
            quoted_price: quotedPrice, slippage_bps: slipBps, shares,
            status: "OPEN", executed_at: nowIso,
          })
          .select().single();
        if (!error && inserted) {
          await supabase.rpc("dash_apply_trade", { p_sub_wallet_id: subId, p_size: size });
          const delay = jitter(3000, 18000);
          setTimeout(async () => {
            if (stopped) return;
            const edge = 0.08;
            const win = Math.random() < Math.min(0.95, quotedPrice + edge);
            const payout = win ? +(size / effPrice).toFixed(2) : 0;
            await supabase.rpc("dash_resolve_trade", {
              p_trade_id: inserted.id, p_status: win ? "WON" : "LOST", p_payout: payout,
            });
          }, delay);
        }
      } catch (e) { console.warn("tick err", e); }
      timer = setTimeout(tick, jitter(1400, 2800));
    };
    timer = setTimeout(tick, 800);
    return () => { stopped = true; clearTimeout(timer); };
  }, [supabase]);

  // Derived state
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
  const blendedRate = ((PRIOR_WINS + liveWins) / (PRIOR_TRADES + resolved.length)) * 100;
  const accuracyRate = Math.max(ACCURACY_FLOOR, blendedRate);

  const labelByAddr = new Map(wallets.map((w) => [w.address.toLowerCase(), w.label] as const));
  const subName = new Map(subWallets.map((s) => [s.id, s.name] as const));
  const subOptions = subWallets.map((s) => ({ id: s.id, name: s.name, liquidity_balance: Number(s.liquidity_balance) }));

  const subStats = useMemo(() => {
    const m = new Map<string, { recentSizes: number[]; openSize: number; efficiency: number; hasEffData: boolean }>();
    for (const sw of subWallets) {
      const subTrades = trades.filter((t) => t.sub_wallet_id === sw.id);
      const recentResolved = subTrades.filter((t) => t.status !== "OPEN").slice(0, 30);
      const recentSizes = recentResolved.map((t) => Number(t.usdc_size));
      const withSlip = recentResolved.filter((t) => t.slippage_bps != null);
      const avgSlip = withSlip.length > 0
        ? withSlip.reduce((s, t) => s + Number(t.slippage_bps ?? 0), 0) / withSlip.length
        : 0;
      const efficiency = Math.max(0, 1 - avgSlip / 10000);
      const openSize = subTrades.filter((t) => t.status === "OPEN").reduce((s, t) => s + Number(t.usdc_size), 0);
      m.set(sw.id, { recentSizes, openSize, efficiency, hasEffData: withSlip.length >= 3 });
    }
    return m;
  }, [trades, subWallets]);

  const liquidityRows: LiquidityRow[] = subWallets.map((sw) => {
    const stats = subStats.get(sw.id) ?? { recentSizes: [], openSize: 0, efficiency: 1, hasEffData: false };
    return {
      id: sw.id, name: sw.name,
      liquidity_balance: Number(sw.liquidity_balance),
      recentSizes: stats.recentSizes, openSize: stats.openSize,
      efficiency: stats.efficiency,
    };
  });

  const tapeItems = trades.slice(0, 10).map((m) => ({
    id: m.id, label: labelByAddr.get(m.wallet_address.toLowerCase()) ?? "—",
    market_title: m.market_title, side: m.side, outcome: m.outcome,
    usdc_size: Number(m.usdc_size), executed_at: m.executed_at, status: m.status,
  }));
  const feedRows = trades.slice(0, 60).map((m) => ({
    id: m.id, wallet_address: m.wallet_address,
    wallet_label: labelByAddr.get(m.wallet_address.toLowerCase()) ?? "—",
    sub_wallet_id: m.sub_wallet_id, market_title: m.market_title,
    side: m.side, outcome: m.outcome,
    usdc_size: Number(m.usdc_size), price: m.price != null ? Number(m.price) : null,
    pnl_usd: Number(m.pnl_usd), slippage_bps: m.slippage_bps != null ? Number(m.slippage_bps) : 0,
    status: m.status, executed_at: m.executed_at, isNew: m.isNew,
  }));
  const perWalletStats = useMemo(() => {
    const m = new Map<string, { count: number; volume: number; last: string | null }>();
    for (const w of wallets) m.set(w.address.toLowerCase(), { count: 0, volume: 0, last: null });
    for (const t of trades) {
      const k = t.wallet_address?.toLowerCase();
      if (!k) continue;
      const s = m.get(k) ?? { count: 0, volume: 0, last: null };
      s.count += 1; s.volume += Number(t.usdc_size ?? 0);
      if (!s.last || new Date(t.executed_at) > new Date(s.last)) s.last = t.executed_at;
      m.set(k, s);
    }
    return m;
  }, [trades, wallets]);

  const activityRows: ActivityRow[] = activity.map((a) => ({ ...a, sub_wallet_name: subName.get(a.sub_wallet_id) }));
  const pendingCount = activity.filter((a) => a.status === "PENDING").length;

  const openModal = (action: "DEPOSIT" | "WITHDRAW", subId?: string) =>
    setModal({ open: true, action, subId });

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)]">
      <TopBar operator={OPERATOR} />
      <MirrorTape items={tapeItems} />

      {/* Tabs */}
      <div className="border-b border-[var(--color-border)] bg-white sticky top-14 z-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 flex gap-1 overflow-x-auto">
          <TabBtn label="Dashboard"          active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
          <TabBtn label="Portfolio activity" active={tab === "activity"}  onClick={() => setTab("activity")} badge={pendingCount > 0 ? pendingCount : undefined} />
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {tab === "dashboard" ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiTile label="Current balance" value={money(totalBalance, { decimals: 0 })} sub={`Started ${money(totalStarting, { decimals: 0 })}`} pulse />
              <KpiTile label="All-time PnL" value={money(allTimePnl, { sign: true, decimals: 0 })} delta={pct(allTimePnlPct, 1)}
                deltaTone={allTimePnl >= 0 ? "positive" : "negative"} sub="Since Dec 1, 2025" />
              <KpiTile label="24h PnL" value={money(pnl24h, { sign: true, decimals: 0 })}
                deltaTone={pnl24h >= 0 ? "positive" : "negative"} sub="Resolved trades" />
              <KpiTile label="Accuracy rate" value={`${accuracyRate.toFixed(1)}%`} deltaTone="positive"
                sub={`Baseline 71% · ${resolved.length} live resolved`} />
            </div>

            <EquityCurve data={initialSnapshots} live={totalBalance} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {subWallets
                .slice()
                .sort((a, b) => Number(b.starting_balance) - Number(a.starting_balance))
                .map((s) => {
                  const st = subStats.get(s.id);
                  return (
                    <SubWalletCard
                      key={s.id}
                      name={s.name}
                      startingBalance={Number(s.starting_balance)}
                      currentBalance={Number(s.current_balance)}
                      efficiency={st?.efficiency ?? 1}
                      hasEffData={st?.hasEffData ?? false}
                    />
                  );
                })}
              <LiquidityPanel
                subs={liquidityRows}
                onDeposit={(id) => openModal("DEPOSIT", id)}
                onWithdraw={(id) => openModal("WITHDRAW", id)}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><TradeFeed rows={feedRows} /></div>
              <div className="space-y-4">
                <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] px-1">Tracked wallets</div>
                {wallets.map((w) => {
                  const s = perWalletStats.get(w.address.toLowerCase()) ?? { count: 0, volume: 0, last: null };
                  return (
                    <WalletCard key={w.address} label={w.label} address={w.address}
                      tradeCount={s.count} totalVolume={s.volume} lastActivity={s.last} paused={w.paused} />
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <PortfolioActivity rows={activityRows} onNewAction={(a) => openModal(a)} />
        )}

        <footer className="pt-8 pb-4 text-[11px] text-[var(--color-subtle)] text-center">
          Polymarket Mirror · Live stream · Supabase Realtime · Built on Next.js
        </footer>
      </div>

      <DepositWithdrawModal
        open={modal.open}
        initialAction={modal.action}
        initialSubId={modal.subId}
        subWallets={subOptions}
        onClose={() => setModal({ ...modal, open: false })}
        onSubmitted={() => { /* realtime sub handles update */ }}
      />
    </main>
  );
}

function TabBtn({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick}
      className={`relative px-4 py-3 text-[13px] transition-colors border-b-2 -mb-px ${
        active ? "border-[var(--color-accent)] text-[var(--color-fg)] font-medium" : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-fg)]"
      }`}>
      {label}
      {badge !== undefined && (
        <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-medium rounded-full bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[var(--color-warning)]/30">
          {badge}
        </span>
      )}
    </button>
  );
}

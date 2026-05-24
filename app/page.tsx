import { readClient } from "@/lib/supabase";
import { TopBar } from "@/components/TopBar";
import { MirrorTape } from "@/components/MirrorTape";
import { KpiTile } from "@/components/KpiTile";
import { EquityCurve } from "@/components/EquityCurve";
import { TradeFeed } from "@/components/TradeFeed";
import { WalletCard } from "@/components/WalletCard";
import { money, pct } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 30;

const OPERATOR_ADDR = "0x0000000000000000000000000000000000000000";

export default async function Page() {
  const supa = readClient();

  const [walletsR, configR, snapshotsR, mirroredR, walletTradesR] = await Promise.all([
    supa.from("dash_tracked_wallets").select("*").order("label"),
    supa.from("dash_config").select("*"),
    supa.from("dash_balance_snapshots").select("balance_usd, recorded_at").order("recorded_at"),
    supa.from("dash_mirrored_trades").select("*").order("executed_at", { ascending: false }).limit(50),
    supa.from("dash_wallet_trades").select("id, wallet_address, market_title, side, outcome, usdc_size, executed_at").order("executed_at", { ascending: false }).limit(20),
  ]);

  const wallets = walletsR.data ?? [];
  const labelByAddr = new Map(wallets.map((w) => [w.address.toLowerCase(), w.label]));
  const config = Object.fromEntries((configR.data ?? []).map((c) => [c.key, c.value]));
  const snapshots = (snapshotsR.data ?? []).map((s) => ({ t: s.recorded_at, v: Number(s.balance_usd) }));
  const mirrored = mirroredR.data ?? [];
  const walletTrades = walletTradesR.data ?? [];

  const startBalance = Number(config.starting_balance ?? 0);
  const currentBalance = snapshots.length ? snapshots[snapshots.length - 1].v : Number(config.current_balance ?? 0);
  const allTimePnl = currentBalance - startBalance;
  const allTimePnlPct = startBalance > 0 ? (allTimePnl / startBalance) * 100 : 0;

  let pnl24h = 0;
  if (snapshots.length >= 2) {
    pnl24h = snapshots[snapshots.length - 1].v - snapshots[snapshots.length - 2].v;
  }

  const winRate = mirrored.length === 0
    ? null
    : (mirrored.filter((m) => Number(m.pnl_usd) > 0).length / mirrored.length) * 100;

  // Per-wallet aggregates from any wallet trades we've recorded so far
  const perWalletStats = new Map<string, { count: number; volume: number; last: string | null }>();
  for (const w of wallets) perWalletStats.set(w.address.toLowerCase(), { count: 0, volume: 0, last: null });
  for (const t of walletTrades) {
    const k = t.wallet_address?.toLowerCase();
    if (!k) continue;
    const s = perWalletStats.get(k) ?? { count: 0, volume: 0, last: null };
    s.count += 1;
    s.volume += Number(t.usdc_size ?? 0);
    if (!s.last || new Date(t.executed_at) > new Date(s.last)) s.last = t.executed_at;
    perWalletStats.set(k, s);
  }

  const tapeItems = mirrored.slice(0, 12).map((m) => ({
    id: m.id,
    label: labelByAddr.get(m.wallet_address.toLowerCase()) ?? "—",
    market_title: m.market_title,
    side: m.side,
    outcome: m.outcome,
    usdc_size: Number(m.usdc_size),
    executed_at: m.executed_at,
  }));

  const feedRows = mirrored.map((m) => ({
    id: m.id,
    wallet_address: m.wallet_address,
    wallet_label: labelByAddr.get(m.wallet_address.toLowerCase()) ?? "—",
    market_title: m.market_title,
    side: m.side,
    outcome: m.outcome,
    usdc_size: Number(m.usdc_size),
    price: m.price != null ? Number(m.price) : null,
    pnl_usd: Number(m.pnl_usd),
    executed_at: m.executed_at,
  }));

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)]">
      <TopBar operator={OPERATOR_ADDR} lastSync={new Date()} />
      <MirrorTape items={tapeItems} />

      <div className="mx-auto max-w-[1400px] px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile
            label="Current balance"
            value={money(currentBalance, { decimals: 0 })}
            sub={`Started ${money(startBalance, { decimals: 0 })}`}
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
            sub="From last snapshot"
          />
          <KpiTile
            label="Win rate"
            value={winRate == null ? "—" : `${winRate.toFixed(1)}%`}
            sub={mirrored.length ? `Of ${mirrored.length} trades` : "Awaiting trades"}
          />
        </div>

        <EquityCurve data={snapshots} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TradeFeed rows={feedRows} />
          </div>
          <div className="space-y-4">
            <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] px-1">Tracked wallets</div>
            {wallets.map((w) => {
              const stats = perWalletStats.get(w.address.toLowerCase()) ?? { count: 0, volume: 0, last: null };
              return (
                <WalletCard
                  key={w.address}
                  label={w.label}
                  address={w.address}
                  tradeCount={stats.count}
                  totalVolume={stats.volume}
                  lastActivity={stats.last}
                />
              );
            })}
          </div>
        </div>

        <footer className="pt-8 pb-4 text-[11px] text-[var(--color-subtle)] text-center">
          Mirror sync every 5 minutes · Polymarket Data API · Built on Supabase
        </footer>
      </div>
    </main>
  );
}

import { readClient } from "@/lib/supabase";
import { DashboardClient } from "@/components/DashboardClient";
import { TRACKED_WALLETS } from "@/lib/wallets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const supa = readClient();
  const [subWalletsR, snapshotsR, mirroredR, activityR] = await Promise.all([
    supa.from("dash_sub_wallets").select("*").order("starting_balance", { ascending: false }),
    supa.from("dash_balance_snapshots").select("balance_usd, recorded_at").order("recorded_at"),
    supa.from("dash_mirrored_trades").select("*").order("executed_at", { ascending: false }).limit(80),
    supa.from("dash_portfolio_activity").select("*").order("created_at", { ascending: false }).limit(80),
  ]);

  const snapshots = (snapshotsR.data ?? []).map((s) => ({ t: s.recorded_at as string, v: Number(s.balance_usd) }));

  return (
    <DashboardClient
      initialSubWallets={(subWalletsR.data ?? []) as never}
      initialSnapshots={snapshots}
      initialMirrored={(mirroredR.data ?? []) as never}
      initialActivity={(activityR.data ?? []) as never}
      initialWallets={TRACKED_WALLETS}
    />
  );
}

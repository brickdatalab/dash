import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { fetchActivity, activityKey, type PMActivity } from "@/lib/polymarket";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supa = adminClient();
  const { data: wallets, error: wErr } = await supa.from("dash_tracked_wallets").select("address");
  if (wErr || !wallets) {
    return NextResponse.json({ ok: false, step: "load_wallets", error: wErr?.message }, { status: 500 });
  }

  let totalNew = 0;
  const perWallet: Record<string, number> = {};
  const errors: Array<{ wallet: string; error: string }> = [];

  for (const w of wallets) {
    const addr = w.address.toLowerCase();
    try {
      const activity = await fetchActivity(addr, { limit: 200 });
      const trades = activity.filter((a) => (a.type ?? "").toUpperCase() === "TRADE");
      if (trades.length === 0) {
        perWallet[addr] = 0;
        continue;
      }

      const rows = trades.map((a: PMActivity) => ({
        wallet_address: addr,
        activity_key: activityKey(a),
        tx_hash: a.transactionHash ?? null,
        market_slug: a.slug ?? null,
        market_title: a.title ?? null,
        market_icon: a.icon ?? null,
        event_slug: a.eventSlug ?? null,
        type: a.type ?? null,
        side: a.side ?? null,
        outcome: a.outcome ?? null,
        outcome_index: a.outcomeIndex ?? null,
        size: a.size ?? null,
        price: a.price ?? null,
        usdc_size: a.usdcSize ?? null,
        executed_at: new Date((a.timestamp ?? 0) * 1000).toISOString(),
        raw_json: a as unknown as object,
      }));

      const { data: inserted, error: insErr } = await supa
        .from("dash_wallet_trades")
        .upsert(rows, { onConflict: "activity_key", ignoreDuplicates: true })
        .select("id, wallet_address, market_slug, market_title, side, outcome, usdc_size, price, executed_at");

      if (insErr) {
        errors.push({ wallet: addr, error: insErr.message });
        continue;
      }
      const newRows = inserted ?? [];
      perWallet[addr] = newRows.length;
      totalNew += newRows.length;

      if (newRows.length > 0) {
        const mirrors = newRows.map((r) => {
          // Synthetic PnL — positions close immediately per spec. Bias mildly positive
          // to keep the narrative consistent with the seeded equity curve.
          const size = Number(r.usdc_size ?? 0);
          const roll = Math.random();
          const factor = roll < 0.55 ? roll * 0.08 + 0.005 : -(roll - 0.55) * 0.06 - 0.002;
          const pnl = Math.round(size * factor * 100) / 100;
          return {
            source_trade_id: r.id,
            wallet_address: r.wallet_address,
            market_slug: r.market_slug,
            market_title: r.market_title,
            side: r.side,
            outcome: r.outcome,
            usdc_size: size,
            price: r.price,
            pnl_usd: pnl,
            executed_at: r.executed_at,
          };
        });
        const { error: mErr } = await supa
          .from("dash_mirrored_trades")
          .upsert(mirrors, { onConflict: "source_trade_id", ignoreDuplicates: true });
        if (mErr) errors.push({ wallet: addr, error: `mirror: ${mErr.message}` });

        // Update current_balance config
        const addPnl = mirrors.reduce((sum, m) => sum + (m.pnl_usd ?? 0), 0);
        const { data: cur } = await supa.from("dash_config").select("value").eq("key", "current_balance").maybeSingle();
        const prev = Number(cur?.value ?? 0);
        const next = prev + addPnl;
        await supa.from("dash_config").upsert({ key: "current_balance", value: next as unknown as object, updated_at: new Date().toISOString() });

        // Snapshot daily
        const today = new Date(); today.setUTCHours(0, 0, 0, 0);
        await supa.from("dash_balance_snapshots").upsert(
          { balance_usd: next, recorded_at: today.toISOString(), source: "trade" },
          { onConflict: "recorded_at" },
        );
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({ wallet: addr, error: msg });
    }
  }

  return NextResponse.json({ ok: true, totalNew, perWallet, errors, syncedAt: new Date().toISOString() });
}

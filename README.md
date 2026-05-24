# Dash — Polymarket Mirror Dashboard

Real-time prediction-market mirror trading dashboard. Tracks 4 Polymarket profile wallets,
mirrors their trades into a synthetic balance, and renders an equity curve since Dec 1, 2025.

## Tech

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS 4** for styling — white, clean, dense, no dark mode
- **Supabase Postgres** for persistent state (project: `poly`)
- **Recharts** for the equity curve
- **Vercel Cron** every 5 minutes pulls fresh activity from the Polymarket Data API

## Tracked wallets

| Label   | Address |
|---------|---------|
| Alpha   | `0xb55fa1296e6ec55d0ce53d93b9237389f11764d4` |
| Bravo   | `0xddb0629096a8a03f490b6572c06f2ee76465f95a` |
| Charlie | `0xa6896d11f76dfa2820662c1f441496f51553559b` |
| Delta   | `0x951bd740ef681d05891ca35440232488271d433e` |

## Balance narrative

- **Start (2025-12-01):** $88,748
- **Current target:** $701,422
- Equity curve is seeded with a smooth exponential interpolation between those endpoints
  (175 daily snapshots). Once the cron starts firing, new mirror trades adjust
  `current_balance` and write fresh snapshots on top of the seed.

## Database schema

All tables live in the `poly` Supabase project, prefixed with `dash_` so they are isolated
from anything else in that project.

```
dash_tracked_wallets     (address PK, label, added_at)
dash_config              (key PK, value jsonb, updated_at)
dash_wallet_trades       (id, wallet_address, activity_key UNIQUE, market_*, side, outcome, size, price, usdc_size, executed_at, raw_json, ...)
dash_mirrored_trades     (id, source_trade_id FK UNIQUE, wallet_address, market_*, side, outcome, usdc_size, price, pnl_usd, executed_at, ...)
dash_balance_snapshots   (id, balance_usd, recorded_at UNIQUE, source)
```

RLS is **enabled** on every table. `anon` has a SELECT-only policy on each, which is what
the dashboard uses for reads. Writes (the cron) require the `service_role` key.

## Local development

```bash
cp .env.example .env.local
# Fill in SUPABASE_SERVICE_ROLE_KEY and CRON_SECRET
npm install
npm run dev
# open http://localhost:3000
```

The dashboard renders entirely from server components; no Supabase keys leak to the browser.

## Deploy to Vercel

1. Push this repo to GitHub (already at `github.com/brickdatalab/dash`).
2. In Vercel, **Import Project** from the GitHub repo.
3. Add environment variables in **Settings → Environment Variables**:

   | Name | Value | Scope |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://cxvntzszdkyggjjenefn.supabase.co` | All |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_9wkdOxVV5AD6atq_4YiMVQ_PB30Cnh6` | All |
   | `SUPABASE_SERVICE_ROLE_KEY` | (Supabase Dashboard → Settings → API → `service_role`) | All |
   | `CRON_SECRET` | a long random string | All |

4. Deploy. Vercel auto-detects Next.js.
5. The cron in `vercel.json` will run `/api/cron/sync` every 5 minutes.
   (Requires Vercel **Pro** — Hobby caps cron to once per day.)

## Manually trigger a sync

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<your-vercel-url>/api/cron/sync
```

## Continuity guarantee

Every page load reads from Supabase — there is no client-side simulation that resets.
The dashboard is byte-for-byte the same on any device, any visit. The cron keeps writing
even when the page is closed.

## Project layout

```
app/
  layout.tsx
  globals.css
  page.tsx                  # main dashboard, server component
  api/cron/sync/route.ts    # Polymarket -> dash_wallet_trades -> dash_mirrored_trades
components/
  TopBar.tsx
  MirrorTape.tsx            # client, scrolling ticker
  KpiTile.tsx
  EquityCurve.tsx           # client, Recharts
  TradeFeed.tsx
  WalletCard.tsx
lib/
  supabase.ts               # readClient() and adminClient()
  polymarket.ts             # Polymarket Data API client
  format.ts                 # money / pct / addr formatters
  types.ts
vercel.json                 # cron schedule
.env.example
```

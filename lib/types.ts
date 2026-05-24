export type TrackedWallet = { address: string; label: string; added_at: string };
export type WalletTrade = {
  id: string; wallet_address: string; activity_key: string;
  tx_hash: string | null; market_slug: string | null; market_title: string | null;
  market_icon: string | null; event_slug: string | null; type: string | null;
  side: string | null; outcome: string | null; outcome_index: number | null;
  size: number | null; price: number | null; usdc_size: number | null;
  executed_at: string; raw_json: unknown; inserted_at: string;
};
export type MirroredTrade = {
  id: string; source_trade_id: string; wallet_address: string;
  market_slug: string | null; market_title: string | null;
  side: string | null; outcome: string | null; usdc_size: number;
  price: number | null; pnl_usd: number; executed_at: string; inserted_at: string;
};
export type BalanceSnapshot = {
  id: string; balance_usd: number; recorded_at: string; source: string;
};

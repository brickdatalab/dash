// Liquidity-aware slippage model
// First N% of utilization is "free" (no slippage). Beyond that, slippage ramps
// linearly. Wider bands and smaller multipliers = friendlier; tighter and larger
// = more punishing.
//
// Defaults are tuned so the demo shows visible deltas for Doug (15k liquidity)
// without being absurd: a $1.5k bet on Doug hits ~240 bps; same bet on Vincent
// (53k) hits ~0 bps.

export const FREE_BAND = 0.02;          // first 2% utilization is free
export const SLIPPAGE_MULTIPLIER = 400; // bps per unit utilization beyond free band

export function slippageBps(betSize: number, availableLiquidity: number): number {
  if (availableLiquidity <= 0 || betSize <= 0) return 0;
  const utilization = betSize / availableLiquidity;
  if (utilization <= FREE_BAND) return 0;
  return Math.round((utilization - FREE_BAND) * SLIPPAGE_MULTIPLIER * 100);
}

export function effectivePrice(quotedPrice: number, slipBps: number, side: string): number {
  const adj = slipBps / 10000;
  const isBuy = (side || "").toUpperCase() === "BUY";
  // BUY: you pay more for the same shares (price up). SELL: you receive less (price down).
  return +(quotedPrice * (isBuy ? 1 + adj : 1 - adj)).toFixed(4);
}

/** Average efficiency (0..1) over a set of past trade sizes given hypothetical liquidity. */
export function projectedEfficiency(tradeSizes: number[], liquidity: number): number {
  if (tradeSizes.length === 0 || liquidity <= 0) return 1;
  const avgSlipBps = tradeSizes.reduce((s, sz) => s + slippageBps(sz, liquidity), 0) / tradeSizes.length;
  return Math.max(0, 1 - avgSlipBps / 10000);
}

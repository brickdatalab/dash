export const DEPOSIT_ADDRESSES = {
  ETH: "0xf9E52161CE4d0945e9531b077B59eF265396D599",
  SOL: "FxbfwTCD1MZP3gXJBjpfuvkkKSyZuvXw4XegBnAob3b2",
} as const;

export type Chain = keyof typeof DEPOSIT_ADDRESSES;

export function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}

/** Random settlement window: 1–3 business days. */
export function pickSettlementWindow(start: Date = new Date()): Date {
  const days = 1 + Math.floor(Math.random() * 3); // 1, 2, or 3
  return addBusinessDays(start, days);
}

export function explorerUrl(chain: Chain, address: string): string {
  return chain === "ETH"
    ? `https://etherscan.io/address/${address}`
    : `https://solscan.io/account/${address}`;
}

const BASE = "https://data-api.polymarket.com";

export type PMActivity = {
  proxyWallet: string;
  transactionHash?: string;
  timestamp: number;
  type?: string;
  asset?: string;
  side?: string;
  outcome?: string;
  outcomeIndex?: number;
  size?: number;
  price?: number;
  usdcSize?: number;
  slug?: string;
  title?: string;
  eventSlug?: string;
  icon?: string;
  conditionId?: string;
};

export async function fetchActivity(
  wallet: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<PMActivity[]> {
  const { limit = 500, offset = 0 } = opts;
  const url = new URL(`${BASE}/activity`);
  url.searchParams.set("user", wallet);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  const res = await fetch(url.toString(), { headers: { accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Polymarket /activity ${res.status} for ${wallet}`);
  const json = (await res.json()) as PMActivity[];
  return Array.isArray(json) ? json : [];
}

export function activityKey(a: PMActivity): string {
  return [
    a.proxyWallet?.toLowerCase() ?? "",
    a.transactionHash ?? "",
    a.timestamp ?? 0,
    a.type ?? "",
    a.asset ?? "",
    a.side ?? "",
    a.slug ?? "",
    a.outcomeIndex ?? "",
  ].join("|");
}

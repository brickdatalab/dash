export const DEPOSIT_ADDRESSES = {
  ETH: "0xf9E52161CE4d0945e9531b077B59eF265396D599",
  SOL: "FxbfwTCD1MZP3gXJBjpfuvkkKSyZuvXw4XegBnAob3b2",
} as const;

export type Chain = keyof typeof DEPOSIT_ADDRESSES;

// US Federal / bank holidays 2026 + 2027 (observed dates).
// Update yearly. Keeping the list short and explicit beats a date library here.
const US_BANK_HOLIDAYS = new Set<string>([
  // 2026
  "2026-01-01", // New Year's Day
  "2026-01-19", // MLK Jr Day (3rd Mon Jan)
  "2026-02-16", // Presidents' Day (3rd Mon Feb)
  "2026-05-25", // Memorial Day (last Mon May)
  "2026-06-19", // Juneteenth (Fri)
  "2026-07-03", // Independence Day observed (July 4 = Saturday → observed Friday)
  "2026-09-07", // Labor Day (1st Mon Sep)
  "2026-10-12", // Columbus Day (2nd Mon Oct)
  "2026-11-11", // Veterans Day (Wed)
  "2026-11-26", // Thanksgiving (4th Thu Nov)
  "2026-12-25", // Christmas (Fri)
  // 2027 (look-ahead)
  "2027-01-01",
  "2027-01-18",
  "2027-02-15",
  "2027-05-31",
  "2027-06-18", // Juneteenth observed (Sat → Fri)
  "2027-07-05", // Independence Day observed (Sun → Mon)
  "2027-09-06",
  "2027-10-11",
  "2027-11-11",
  "2027-11-25",
  "2027-12-24", // Christmas observed (Sat → Fri)
]);

/** Local-timezone YYYY-MM-DD (matches what the user sees in their browser). */
function localDateString(d: Date): string {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${dy}`;
}

function isBusinessDay(d: Date): boolean {
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return false;            // Sun / Sat
  return !US_BANK_HOLIDAYS.has(localDateString(d));    // skip bank holidays
}

/** Advance `days` business days from `start`, skipping weekends and US bank holidays. */
export function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (isBusinessDay(d)) added++;
  }
  return d;
}

/** Random settlement window: 1–3 business days, honoring weekends + holidays. */
export function pickSettlementWindow(start: Date = new Date()): Date {
  const days = 1 + Math.floor(Math.random() * 3); // 1, 2, or 3
  return addBusinessDays(start, days);
}

/** Display the ETA as an actual date the user can read. */
export function formatEtaDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function explorerUrl(chain: Chain, address: string): string {
  return chain === "ETH"
    ? `https://etherscan.io/address/${address}`
    : `https://solscan.io/account/${address}`;
}

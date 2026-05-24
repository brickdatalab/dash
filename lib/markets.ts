// Realistic Polymarket-style market pool for the live stream.
// Mixes crypto / politics / sports / culture in the slug & title patterns
// that actually appear on Polymarket.

export type MarketTemplate = {
  slug: string;
  title: string;
  outcomes: [string, string];
  category: "crypto" | "politics" | "sports" | "culture";
};

export const MARKETS: MarketTemplate[] = [
  { slug: "btc-updown-5m", title: "Bitcoin Up or Down — next 5 min", outcomes: ["Up", "Down"], category: "crypto" },
  { slug: "eth-updown-5m", title: "Ethereum Up or Down — next 5 min", outcomes: ["Up", "Down"], category: "crypto" },
  { slug: "sol-updown-5m", title: "Solana Up or Down — next 5 min", outcomes: ["Up", "Down"], category: "crypto" },
  { slug: "btc-100k-eoy", title: "Will Bitcoin close above $120k by EOY?", outcomes: ["Yes", "No"], category: "crypto" },
  { slug: "eth-5k-q3", title: "Will Ethereum reach $5,000 in Q3?", outcomes: ["Yes", "No"], category: "crypto" },
  { slug: "fed-cut-june", title: "Fed cuts rates at June FOMC?", outcomes: ["Yes", "No"], category: "politics" },
  { slug: "trump-approval-50", title: "Trump approval >50% on June 30?", outcomes: ["Yes", "No"], category: "politics" },
  { slug: "house-bill-pass-june", title: "Major spending bill signed by July 1?", outcomes: ["Yes", "No"], category: "politics" },
  { slug: "lakers-celtics-tonight", title: "Lakers vs Celtics — Lakers win", outcomes: ["Yes", "No"], category: "sports" },
  { slug: "nba-finals-mvp", title: "NBA Finals MVP — Tatum", outcomes: ["Yes", "No"], category: "sports" },
  { slug: "epl-arsenal-title", title: "Arsenal win Premier League?", outcomes: ["Yes", "No"], category: "sports" },
  { slug: "wnba-liberty-ou", title: "Liberty vs Wings: O/U 178.5", outcomes: ["Over", "Under"], category: "sports" },
  { slug: "ucl-final-psg", title: "PSG win Champions League final?", outcomes: ["Yes", "No"], category: "sports" },
  { slug: "mlb-yankees-100w", title: "Yankees win 100+ games this season?", outcomes: ["Yes", "No"], category: "sports" },
  { slug: "ufc-jones-aspinall", title: "Jon Jones beats Aspinall?", outcomes: ["Yes", "No"], category: "sports" },
  { slug: "gpt5-release-q3", title: "GPT-5 launched by end of Q3?", outcomes: ["Yes", "No"], category: "culture" },
  { slug: "spacex-starship-orbit", title: "Starship reaches orbit by July 1?", outcomes: ["Yes", "No"], category: "culture" },
  { slug: "movie-bo-100m", title: "Top film opens >$100M this weekend?", outcomes: ["Yes", "No"], category: "culture" },
  { slug: "btc-dom-55", title: "BTC dominance >55% on July 1?", outcomes: ["Yes", "No"], category: "crypto" },
  { slug: "eth-merge-staking-30", title: "ETH staked >30% by Q3?", outcomes: ["Yes", "No"], category: "crypto" },
  { slug: "nvda-3t-mc", title: "NVIDIA market cap >$3.5T by June 30?", outcomes: ["Yes", "No"], category: "culture" },
  { slug: "tesla-deliv-q2", title: "Tesla Q2 deliveries >480k?", outcomes: ["Yes", "No"], category: "culture" },
  { slug: "open-ai-ipo-25", title: "OpenAI files for IPO in 2026?", outcomes: ["Yes", "No"], category: "culture" },
  { slug: "trump-tweet-100", title: "Trump posts >100 times today?", outcomes: ["Yes", "No"], category: "politics" },
  { slug: "us-cpi-3", title: "May CPI prints below 3.0%?", outcomes: ["Yes", "No"], category: "politics" },
  { slug: "nfl-superbowl-chiefs", title: "Chiefs win Super Bowl LX?", outcomes: ["Yes", "No"], category: "sports" },
  { slug: "f1-monaco-verstappen", title: "Verstappen wins Monaco GP?", outcomes: ["Yes", "No"], category: "sports" },
  { slug: "msft-4t", title: "Microsoft tops $4T by Q3?", outcomes: ["Yes", "No"], category: "culture" },
  { slug: "doge-1-cent", title: "Dogecoin >$0.20 in June?", outcomes: ["Yes", "No"], category: "crypto" },
  { slug: "amazon-prime-day-record", title: "Prime Day breaks sales record?", outcomes: ["Yes", "No"], category: "culture" },
];

export function pickMarket(): MarketTemplate {
  return MARKETS[Math.floor(Math.random() * MARKETS.length)];
}

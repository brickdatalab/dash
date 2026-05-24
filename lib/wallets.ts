export const TRACKED_WALLETS = [
  { address: "0xb55fa1296e6ec55d0ce53d93b9237389f11764d4", label: "Alpha" },
  { address: "0xddb0629096a8a03f490b6572c06f2ee76465f95a", label: "Bravo" },
  { address: "0xa6896d11f76dfa2820662c1f441496f51553559b", label: "Charlie" },
  { address: "0x951bd740ef681d05891ca35440232488271d433e", label: "Delta" },
];

export function pickWallet() {
  return TRACKED_WALLETS[Math.floor(Math.random() * TRACKED_WALLETS.length)];
}

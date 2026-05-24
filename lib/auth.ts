// HMAC-signed session cookie. Edge-runtime compatible (Web Crypto only).

export const SESSION_COOKIE = "dash_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const enc = new TextEncoder();

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toHex(buf: ArrayBuffer): string {
  const u = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < u.length; i++) s += u[i].toString(16).padStart(2, "0");
  return s;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function signSession(username: string): Promise<string> {
  const secret = process.env.DASH_SESSION_SECRET;
  if (!secret) throw new Error("DASH_SESSION_SECRET missing");
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `${username}.${exp}`;
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${payload}.${toHex(sig)}`;
}

export async function verifySession(cookie: string): Promise<{ username: string } | null> {
  const secret = process.env.DASH_SESSION_SECRET;
  if (!secret || !cookie) return null;
  const parts = cookie.split(".");
  if (parts.length !== 3) return null;
  const [username, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!exp || !Number.isFinite(exp) || exp < Date.now()) return null;
  const key = await getKey(secret);
  const expected = await crypto.subtle.sign("HMAC", key, enc.encode(`${username}.${exp}`));
  if (!timingSafeEqual(toHex(expected), sig)) return null;
  return { username };
}

export function validateCredentials(username: string, password: string): boolean {
  const u = (username || "").toLowerCase().trim();
  if (u === "doug"    && password === (process.env.DASH_PWD_DOUG    || "")) return true;
  if (u === "vincent" && password === (process.env.DASH_PWD_VINCENT || "")) return true;
  return false;
}

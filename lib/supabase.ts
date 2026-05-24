import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function assertEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

/** Server-side read client. */
export function readClient(): SupabaseClient {
  return createClient(
    assertEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    assertEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    { auth: { persistSession: false } },
  );
}

/** Server-side admin client (cron). */
export function adminClient(): SupabaseClient {
  return createClient(
    assertEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    assertEnv("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false } },
  );
}

/** Browser-side client (anon, read + Realtime + RPC). */
let _browser: SupabaseClient | null = null;
export function browserClient(): SupabaseClient {
  if (_browser) return _browser;
  _browser = createClient(
    assertEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    assertEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 20 } } },
  );
  return _browser;
}

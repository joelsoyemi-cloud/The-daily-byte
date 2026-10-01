import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Cookie-free anonymous reads for public discovery documents. Never a service key. */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Uses the SERVICE ROLE key, which bypasses RLS. Server-only. Never import
// this from a client component.
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

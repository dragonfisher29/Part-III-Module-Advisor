import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getSupabaseKeys() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  const config = getSupabaseKeys();

  if (!config) {
    return null;
  }

  return createClient(config.url, config.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

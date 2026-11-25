import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { readServerEnv } from "@/lib/env";

export function createServiceSupabaseClient(
  source: Record<string, string | undefined> = process.env,
) {
  const env = readServerEnv(source);
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

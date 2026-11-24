import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";
import { readPublicEnv } from "@/lib/env";

export function createBrowserSupabaseClient(
  env = readPublicEnv(process.env),
) {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

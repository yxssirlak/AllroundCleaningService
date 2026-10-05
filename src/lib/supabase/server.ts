import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";
import { REMEMBER_SESSION_MAX_AGE, REMEMBER_SESSION_COOKIE } from "./session-preference";
import type { Database } from "./database.types";

export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase-configuratie ontbreekt.");
  }

  const cookieStore = await cookies();
  const rememberSession = cookieStore.get(REMEMBER_SESSION_COOKIE)?.value === "1";

  return createServerClient<Database>(
    config.url,
    config.publishableKey,
    {
      cookieOptions: rememberSession ? { maxAge: REMEMBER_SESSION_MAX_AGE } : {},
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies; proxy.ts refreshes their session.
          }
        },
      },
    },
  );
}

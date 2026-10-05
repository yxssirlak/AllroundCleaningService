"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";
import { REMEMBER_SESSION_MAX_AGE, shouldRememberSession } from "./session-preference";
import type { Database } from "./database.types";

export function createSupabaseBrowserClient(options?: { rememberSession?: boolean }) {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase-configuratie ontbreekt.");
  }

  const rememberSession = options?.rememberSession
    ?? (typeof document !== "undefined" && shouldRememberSession(document.cookie));

  return createBrowserClient<Database>(
    config.url,
    config.publishableKey,
    {
      cookieOptions: rememberSession ? { maxAge: REMEMBER_SESSION_MAX_AGE } : {},
      ...(options ? { isSingleton: false } : {}),
    },
  );
}

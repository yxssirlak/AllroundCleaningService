"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";
import { REMEMBER_SESSION_MAX_AGE, shouldRememberSession } from "./session-preference";
import type { Database } from "./database.types";

// 1. Bewaar de actieve connectie in het geheugen van de browser
let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createSupabaseBrowserClient(options?: { rememberSession?: boolean }) {
  // 2. Hergebruik de bestaande client als er geen unieke opties worden gevraagd
  if (!options && browserClient) {
    return browserClient;
  }

  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase-configuratie ontbreekt.");
  }

  const rememberSession = options?.rememberSession
    ?? (typeof document !== "undefined" && shouldRememberSession(document.cookie));

  // 3. Maak de client aan met behoud van de standaard singleton-beveiliging
  const client = createBrowserClient<Database>(
    config.url,
    config.publishableKey,
    {
      cookieOptions: rememberSession ? { maxAge: REMEMBER_SESSION_MAX_AGE } : {},
    }
  );

  // 4. Sla de standaard client op zodat volgende renders deze kunnen hergebruiken
  if (!options) {
    browserClient = client;
  }

  return client;
}
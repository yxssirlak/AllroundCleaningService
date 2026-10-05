import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type InventoryAuth =
  | { supabase: SupabaseClient<Database> }
  | { response: NextResponse };

export async function requireInventoryUser(): Promise<InventoryAuth> {
  if (!isSupabaseConfigured()) {
    return {
      response: NextResponse.json(
        { error: "Voorraadbeheer is nog niet gekoppeld aan Supabase." },
        { status: 503 },
      ),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    console.error("Supabase-aanmelding kon niet worden gecontroleerd:", error.message);
  }

  if (error || !data?.claims?.sub) {
    return {
      response: NextResponse.json(
        { error: "Log in om voorraadbeheer te gebruiken." },
        { status: 401 },
      ),
    };
  }

  const { data: isMember, error: membershipError } = await supabase.rpc("is_inventory_member");

  if (membershipError) {
    console.error("Toegang tot het magazijn kon niet worden gecontroleerd:", membershipError.message);
    return {
      response: NextResponse.json(
        { error: "De magazijndatabase is nog niet volledig ingesteld." },
        { status: 503 },
      ),
    };
  }

  if (!isMember) {
    return {
      response: NextResponse.json(
        { error: "Je account heeft geen toegang tot het bedrijfsvoorraadbeheer." },
        { status: 403 },
      ),
    };
  }

  return { supabase };
}

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import LoginForm from "./login-form";

function safeNextPath(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/erp/voorraad";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);
  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error) {
      console.error("Loginpagina kon de aanmelding niet controleren:", error.message);
    }

    if (!error && data?.claims?.sub) {
      redirect(nextPath);
    }
  }

  return <LoginForm configured={configured} nextPath={nextPath} />;
}

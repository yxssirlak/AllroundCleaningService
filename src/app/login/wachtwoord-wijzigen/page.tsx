import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import UpdatePasswordForm from "./update-password-form";

export default function UpdatePasswordPage() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  return <UpdatePasswordForm />;
}

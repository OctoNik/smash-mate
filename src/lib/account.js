import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAccount() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login?error=Silakan masuk untuk melanjutkan.");
  const name = typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
    ? user.user_metadata.full_name.trim()
    : user.email?.split("@")[0] ?? "Pemain";
  return { supabase, user, name };
}

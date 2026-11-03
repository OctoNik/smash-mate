"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const errorUrl = (message) => `/partner/password?error=${encodeURIComponent(message)}`;

export async function setPartnerPassword(formData) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login?error=Silakan masuk sebagai Mitra GOR.");
  if (user.app_metadata?.smashmate_role !== "partner" ||
      user.app_metadata?.password_setup_required !== true) redirect("/dashboard");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 12 || password.length > 128 || password !== confirmation) {
    redirect(errorUrl("Kata sandi baru harus 12–128 karakter dan kedua isian harus sama."));
  }
  const { data, error } = await supabase.functions.invoke("provision-partner", {
    body: { action: "set_password", password },
  });
  if (error || !data?.ok) redirect(errorUrl(data?.error || "Kata sandi belum dapat disimpan."));
  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) redirect("/login?message=Kata sandi baru tersimpan. Silakan masuk kembali.");
  redirect("/partner/setup");
}

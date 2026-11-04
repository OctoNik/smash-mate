"use server";

import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/account";

export async function deleteAccount(formData) {
  const { supabase, user } = await requireAccount();
  const settingsPath = ["partner", "operator"].includes(user.app_metadata?.smashmate_role) ? "/settings" : "/profile#delete-account";
  const errorUrl = (message) => `${settingsPath.split("#")[0]}?account_error=${encodeURIComponent(message)}${settingsPath.includes("#") ? "#delete-account" : ""}`;
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (confirmation !== "HAPUS" || !password || password.length > 256) {
    redirect(errorUrl("Ketik HAPUS dan masukkan kata sandi akun."));
  }

  const { data, error } = await supabase.functions.invoke("delete-account", {
    body: { confirmation, password },
  });
  if (error || !data || data.message !== "Akun berhasil dihapus.") {
    redirect(errorUrl(data?.message ?? "Akun belum dapat dihapus. Coba lagi."));
  }
  await supabase.auth.signOut();
  redirect("/login?message=Akun%20berhasil%20dihapus.");
}

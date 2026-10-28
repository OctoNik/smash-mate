"use server";

import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/account";

const errorUrl = (message) => `/settings?error=${encodeURIComponent(message)}`;

export async function deleteAccount(formData) {
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (confirmation !== "HAPUS" || !password || password.length > 256) {
    redirect(errorUrl("Ketik HAPUS dan masukkan kata sandi akun."));
  }

  const { supabase } = await requireAccount();
  const { data, error } = await supabase.functions.invoke("delete-account", {
    body: { confirmation, password },
  });
  if (error || !data || data.message !== "Akun berhasil dihapus.") {
    redirect(errorUrl(data?.message ?? "Akun belum dapat dihapus. Coba lagi."));
  }
  await supabase.auth.signOut();
  redirect("/login?message=Akun%20berhasil%20dihapus.");
}

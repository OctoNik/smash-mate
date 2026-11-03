"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/account";

export async function provisionPartner(_previousState, formData) {
  const { supabase, user } = await requireAccount();
  if (user.app_metadata?.smashmate_role !== "operator") redirect("/dashboard");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { error: "Masukkan email Mitra yang valid.", credentials: null };
  }
  const { data, error } = await supabase.functions.invoke("provision-partner", {
    body: { action: "create", email },
  });
  if (error || !data?.ok || !data.initialPassword) {
    return { error: data?.error || "Akun belum dapat dibuat. Periksa apakah email sudah terdaftar.", credentials: null };
  }
  revalidatePath("/operator");
  return { error: "", credentials: { email: data.email, initialPassword: data.initialPassword } };
}

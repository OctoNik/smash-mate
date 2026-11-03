"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/account";

export async function invitePartner(formData) {
  const { supabase, user } = await requireAccount();
  if (user.app_metadata?.smashmate_role !== "operator") redirect("/dashboard");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const venueName = String(formData.get("venue_name") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      venueName.length < 3 || venueName.length > 100) {
    redirect("/operator?error=Periksa email dan nama GOR.");
  }
  const { data, error } = await supabase.functions.invoke("invite-partner", {
    body: { email, venueName },
  });
  if (error || !data?.ok) {
    redirect(`/operator?error=${encodeURIComponent(data?.error || "Undangan belum dapat dikirim.")}`);
  }
  revalidatePath("/operator");
  redirect("/operator?message=Undangan Mitra GOR berhasil dikirim.");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlayerAccount } from "@/lib/account";

export async function saveCoachProfile(formData) {
  const { supabase, user, name } = await requirePlayerAccount();
  const bio = String(formData.get("bio") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const active = formData.get("is_active") === "on";
  if (bio.length > 600 || city.length > 80) redirect("/coaches?error=Bio atau kota terlalu panjang.");
  const { error } = await supabase.from("coach_profiles").upsert({
    user_id: user.id, display_name: name.slice(0, 60), bio, city, is_active: active,
  }, { onConflict: "user_id" });
  if (error) redirect("/coaches?error=Profil coach belum dapat disimpan.");
  revalidatePath("/coaches");
  redirect("/coaches?message=Profil coach tersimpan.");
}

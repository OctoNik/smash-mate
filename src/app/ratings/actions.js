"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/account";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function submitRating(formData) {
  const { supabase } = await requireAccount();
  const activityId = String(formData.get("activity_id") ?? "");
  const recipientId = String(formData.get("recipient_id") ?? "");
  const stars = Number(formData.get("stars"));
  if (!uuidPattern.test(activityId) || !uuidPattern.test(recipientId) ||
      !Number.isInteger(stars) || stars < 1 || stars > 5) {
    redirect("/ratings?error=Periksa pemain dan jumlah bintang.");
  }
  const { error } = await supabase.rpc("rate_activity_participant", {
    p_activity_id: activityId, p_recipient_id: recipientId, p_stars: stars,
  });
  if (error) redirect("/ratings?error=Rating belum tersimpan. Pastikan Anda peserta dan aktivitas sudah dimulai.");
  revalidatePath("/ratings");
  redirect("/ratings?message=Rating berhasil dikirim.");
}

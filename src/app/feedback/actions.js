"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/account";

const categories = new Set(["bug", "idea", "other"]);

export async function sendFeedback(formData) {
  const { supabase, user } = await requireAccount();
  const category = String(formData.get("category") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!categories.has(category) || message.length < 10 || message.length > 1000) {
    redirect("/feedback?error=Pesan harus berisi 10 sampai 1000 karakter.");
  }
  const { error } = await supabase.from("feedback").insert({ user_id: user.id, category, message });
  if (error) redirect("/feedback?error=Masukan belum terkirim. Coba lagi.");
  revalidatePath("/feedback");
  redirect("/feedback?message=Terima kasih. Masukan Anda berhasil dikirim.");
}

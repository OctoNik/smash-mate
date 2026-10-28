"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/account";

const kinds = new Set(["match", "coaching", "event"]);
const levels = new Set(["beginner", "intermediate", "professional", "all"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const errorUrl = (message) => `/activities?error=${encodeURIComponent(message)}`;

export async function createActivity(formData) {
  const { supabase, user, name } = await requireAccount();
  const kind = String(formData.get("kind") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const level = String(formData.get("level") ?? "");
  const capacity = Number(formData.get("capacity"));
  const dateInput = String(formData.get("starts_at") ?? "");
  const startsAt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateInput)
    ? new Date(`${dateInput}:00+07:00`) : new Date(NaN);

  if (!kinds.has(kind) || !levels.has(level) || title.length < 5 || title.length > 100 ||
      description.length > 1000 || location.length < 3 || location.length > 160 ||
      !Number.isInteger(capacity) || capacity < 2 || capacity > 100 ||
      !Number.isFinite(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
    redirect(errorUrl("Periksa judul, lokasi, waktu, kapasitas, dan level aktivitas."));
  }

  const { error } = await supabase.from("activities").insert({
    host_id: user.id,
    host_name: name.slice(0, 60),
    kind,
    title,
    description,
    location,
    level,
    capacity,
    starts_at: startsAt.toISOString(),
  });
  if (error) redirect(errorUrl("Aktivitas belum tersimpan. Coba lagi."));
  revalidatePath("/activities");
  redirect("/activities?message=Aktivitas berhasil dibuat.");
}

export async function joinActivity(formData) {
  const { supabase } = await requireAccount();
  const id = String(formData.get("id") ?? "");
  if (!uuidPattern.test(id)) redirect(errorUrl("Aktivitas tidak valid."));
  const { error } = await supabase.rpc("join_activity", { p_activity_id: id });
  if (error) redirect(errorUrl("Tidak dapat bergabung. Periksa ketersediaan slot."));
  revalidatePath("/activities");
  redirect("/activities?message=Anda berhasil bergabung.");
}

export async function leaveActivity(formData) {
  const { supabase, user } = await requireAccount();
  const id = String(formData.get("id") ?? "");
  if (!uuidPattern.test(id)) redirect(errorUrl("Aktivitas tidak valid."));
  const { error } = await supabase.from("activity_participants").delete().eq("activity_id", id).eq("user_id", user.id);
  if (error) redirect(errorUrl("Belum dapat keluar dari aktivitas."));
  revalidatePath("/activities");
  redirect("/activities?message=Anda keluar dari aktivitas.");
}

export async function deleteActivity(formData) {
  const { supabase, user } = await requireAccount();
  const id = String(formData.get("id") ?? "");
  if (!uuidPattern.test(id)) redirect(errorUrl("Aktivitas tidak valid."));
  const { error } = await supabase.from("activities").delete().eq("id", id).eq("host_id", user.id);
  if (error) redirect(errorUrl("Aktivitas belum dapat dihapus."));
  revalidatePath("/activities");
  redirect("/activities?message=Aktivitas dihapus.");
}

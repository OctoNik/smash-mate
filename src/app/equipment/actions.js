"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/account";

const kinds = new Set(["racket_rental", "shuttle_purchase"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const errorUrl = (message) => `/equipment?error=${encodeURIComponent(message)}`;

export async function createEquipmentRequest(formData) {
  const { supabase, user } = await requireAccount();
  const kind = String(formData.get("kind") ?? "");
  const quantity = Number(formData.get("quantity"));
  const neededAt = String(formData.get("needed_at") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!kinds.has(kind) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(neededAt) || Number.isNaN(Date.parse(neededAt)) ||
      notes.length > 500) {
    redirect(errorUrl("Periksa jenis, jumlah, tanggal, dan catatan permintaan."));
  }

  const { error } = await supabase.from("equipment_requests").insert({
    user_id: user.id, kind, quantity, needed_at: neededAt, notes,
  });
  if (error) redirect(errorUrl("Permintaan belum tersimpan. Periksa tanggal dan coba lagi."));
  revalidatePath("/equipment");
  redirect("/equipment?message=Permintaan perlengkapan berhasil dikirim.");
}

export async function cancelEquipmentRequest(formData) {
  const { supabase } = await requireAccount();
  const id = String(formData.get("id") ?? "");
  if (!uuidPattern.test(id)) redirect(errorUrl("Permintaan tidak valid."));
  const { error } = await supabase.rpc("cancel_equipment_request", { p_request_id: id });
  if (error) redirect(errorUrl("Permintaan belum dapat dibatalkan."));
  revalidatePath("/equipment");
  redirect("/equipment?message=Permintaan dibatalkan.");
}

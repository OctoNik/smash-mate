"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/account";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createCommunity(formData) {
  const { supabase, user } = await requireAccount();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  if (name.length < 3 || name.length > 80 || description.length > 800 || city.length > 80) {
    redirect("/communities?error=Periksa nama, kota, dan deskripsi komunitas.");
  }
  const { data, error } = await supabase.from("communities").insert({ owner_id: user.id, name, description, city }).select("id").single();
  if (error) redirect("/communities?error=Komunitas belum dapat dibuat.");
  await supabase.from("community_members").insert({ community_id: data.id, user_id: user.id });
  revalidatePath("/communities");
  redirect("/communities?message=Komunitas berhasil dibuat.");
}

export async function joinCommunity(formData) {
  const { supabase, user } = await requireAccount();
  const id = String(formData.get("id") ?? "");
  if (!uuid.test(id)) redirect("/communities?error=Komunitas tidak valid.");
  const { error } = await supabase.from("community_members").insert({ community_id: id, user_id: user.id });
  if (error) redirect("/communities?error=Belum dapat bergabung.");
  revalidatePath("/communities");
  redirect("/communities?message=Anda bergabung dengan komunitas.");
}

export async function leaveCommunity(formData) {
  const { supabase, user } = await requireAccount();
  const id = String(formData.get("id") ?? "");
  if (!uuid.test(id)) redirect("/communities?error=Komunitas tidak valid.");
  const { data: community } = await supabase.from("communities").select("owner_id").eq("id", id).maybeSingle();
  if (community?.owner_id === user.id) redirect("/communities?error=Pendiri komunitas tidak dapat keluar.");
  const { error } = await supabase.from("community_members").delete().eq("community_id", id).eq("user_id", user.id);
  if (error) redirect("/communities?error=Belum dapat keluar.");
  revalidatePath("/communities");
  redirect("/communities?message=Anda keluar dari komunitas.");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlayerAccount } from "@/lib/account";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createCommunity(formData) {
  const { supabase, user, name: ownerName } = await requirePlayerAccount();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  if (name.length < 3 || name.length > 80 || description.length > 800 || city.length > 80) {
    redirect("/communities?error=Periksa nama, kota, dan deskripsi komunitas.");
  }
  const { data, error } = await supabase.from("communities").insert({ owner_id: user.id, owner_name: ownerName.slice(0, 60), name, description, city }).select("id").single();
  if (error) redirect("/communities?error=Komunitas belum dapat dibuat.");
  await supabase.from("community_members").insert({ community_id: data.id, user_id: user.id, display_name: ownerName.slice(0, 60) });
  revalidatePath("/communities");
  redirect(`/communities/${data.id}?message=Komunitas berhasil dibuat.`);
}

export async function joinCommunity(formData) {
  const { supabase, user, name } = await requirePlayerAccount();
  const id = String(formData.get("id") ?? "");
  if (!uuid.test(id)) redirect("/communities?error=Komunitas tidak valid.");
  const { error } = await supabase.from("community_members").insert({ community_id: id, user_id: user.id, display_name: name.slice(0, 60) });
  if (error) redirect(`/communities/${id}?error=Belum dapat bergabung.`);
  revalidatePath("/communities");
  revalidatePath(`/communities/${id}`);
  redirect(`/communities/${id}?message=Anda bergabung dengan komunitas.`);
}

export async function leaveCommunity(formData) {
  const { supabase, user } = await requirePlayerAccount();
  const id = String(formData.get("id") ?? "");
  if (!uuid.test(id)) redirect("/communities?error=Komunitas tidak valid.");
  const { data: community } = await supabase.from("communities").select("owner_id").eq("id", id).maybeSingle();
  if (community?.owner_id === user.id) redirect(`/communities/${id}?error=Pendiri komunitas tidak dapat keluar.`);
  const { error } = await supabase.from("community_members").delete().eq("community_id", id).eq("user_id", user.id);
  if (error) redirect(`/communities/${id}?error=Belum dapat keluar.`);
  revalidatePath("/communities");
  revalidatePath(`/communities/${id}`);
  redirect(`/communities/${id}?message=Anda keluar dari komunitas.`);
}

export async function updateCommunity(formData) {
  const { supabase, user } = await requirePlayerAccount();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!uuid.test(id) || name.length < 3 || name.length > 80 || city.length > 80 || description.length > 800) redirect("/communities?error=Periksa data komunitas.");
  const { data, error } = await supabase.from("communities").update({ name, city, description }).eq("id", id).eq("owner_id", user.id).select("id").maybeSingle();
  if (error || !data) redirect(`/communities/${id}?error=Komunitas belum diperbarui.`);
  revalidatePath("/communities"); revalidatePath(`/communities/${id}`);
  redirect(`/communities/${id}?message=Profil komunitas diperbarui.`);
}

export async function setCommunityAdmin(formData) {
  const { supabase, user } = await requirePlayerAccount();
  const id = String(formData.get("id") ?? "");
  const memberId = String(formData.get("member_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!uuid.test(id) || !uuid.test(memberId) || !["member", "admin"].includes(role)) redirect("/communities?error=Data anggota tidak valid.");
  const { data: community } = await supabase.from("communities").select("owner_id").eq("id", id).maybeSingle();
  if (community?.owner_id !== user.id || memberId === user.id) redirect(`/communities/${id}?tab=members&error=Hanya pendiri yang dapat mengatur admin.`);
  const { data, error } = await supabase.from("community_members").update({ role }).eq("community_id", id).eq("user_id", memberId).select("user_id").maybeSingle();
  if (error || !data) redirect(`/communities/${id}?tab=members&error=Peran anggota belum tersimpan.`);
  revalidatePath(`/communities/${id}`);
  redirect(`/communities/${id}?tab=members&message=Peran anggota diperbarui.`);
}

export async function deleteCommunity(formData) {
  const { supabase, user } = await requirePlayerAccount();
  const id = String(formData.get("id") ?? "");
  if (!uuid.test(id)) redirect("/communities?error=Komunitas tidak valid.");
  const { data, error } = await supabase.from("communities").delete().eq("id", id).eq("owner_id", user.id).select("id").maybeSingle();
  if (error || !data) redirect(`/communities/${id}?error=Komunitas belum dapat dihapus.`);
  revalidatePath("/communities");
  redirect("/communities?message=Komunitas dihapus.");
}

export async function uploadCommunityPhoto(formData) {
  const { supabase, user } = await requirePlayerAccount();
  const id = String(formData.get("id") ?? "");
  const file = formData.get("image");
  if (!uuid.test(id) || !(file instanceof File) || file.size < 1 || file.size > 3 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) redirect("/communities?error=Foto harus JPG, PNG, atau WebP maksimal 3 MB.");
  const { data: owned } = await supabase.from("communities").select("id,owner_id,community_members(user_id,role)").eq("id", id).maybeSingle();
  if (!owned || (owned.owner_id !== user.id && !owned.community_members?.some((member) => member.user_id === user.id && member.role === "admin"))) redirect("/communities?error=Komunitas tidak ditemukan.");
  const { count } = await supabase.from("community_photos").select("id", { count: "exact", head: true }).eq("community_id", id);
  if ((count ?? 0) >= 12) redirect(`/communities/${id}?error=Maksimal 12 foto komunitas.`);
  const bytes = Buffer.from(await file.arrayBuffer());
  const jpeg = file.type === "image/jpeg" && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png = file.type === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp = file.type === "image/webp" && bytes.toString("ascii",0,4) === "RIFF" && bytes.toString("ascii",8,12) === "WEBP";
  if (!jpeg && !png && !webp) redirect(`/communities/${id}?error=Isi foto tidak sesuai format.`);
  const path = `${id}/${crypto.randomUUID()}.${jpeg ? "jpg" : png ? "png" : "webp"}`;
  const { error: uploadError } = await supabase.storage.from("community-media").upload(path, bytes, { contentType: file.type });
  if (uploadError) redirect(`/communities/${id}?error=Foto belum terunggah.`);
  const { error } = await supabase.from("community_photos").insert({ community_id: id, image_path: path });
  if (error) { await supabase.storage.from("community-media").remove([path]); redirect(`/communities/${id}?error=Foto belum tersimpan.`); }
  revalidatePath("/communities"); revalidatePath(`/communities/${id}`);
  redirect(`/communities/${id}?tab=gallery&message=Foto ditambahkan.`);
}

export async function removeCommunityPhoto(formData) {
  const { supabase, user } = await requirePlayerAccount();
  const id = String(formData.get("id") ?? "");
  const photoId = String(formData.get("photo_id") ?? "");
  if (!uuid.test(id) || !uuid.test(photoId)) redirect("/communities?error=Foto tidak valid.");
  const { data: owned } = await supabase.from("communities").select("id,owner_id,community_members(user_id,role)").eq("id", id).maybeSingle();
  if (!owned || (owned.owner_id !== user.id && !owned.community_members?.some((member) => member.user_id === user.id && member.role === "admin"))) redirect("/communities?error=Komunitas tidak ditemukan.");
  const { data: photo } = await supabase.from("community_photos").select("image_path").eq("id", photoId).eq("community_id", id).maybeSingle();
  if (!photo) redirect(`/communities/${id}?error=Foto tidak ditemukan.`);
  const { error } = await supabase.from("community_photos").delete().eq("id", photoId);
  if (error) redirect(`/communities/${id}?error=Foto belum dapat dihapus.`);
  await supabase.storage.from("community-media").remove([photo.image_path]);
  revalidatePath("/communities"); revalidatePath(`/communities/${id}`);
  redirect(`/communities/${id}?tab=gallery&message=Foto dihapus.`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const levels = new Set(["beginner", "intermediate", "professional"]);

export async function updateProfile(formData) {
  const fullName = String(formData.get("full_name") ?? "").trim().replace(/\s+/g, " ");
  const level = String(formData.get("level") ?? "");

  if (fullName.length < 2 || fullName.length > 60 || !levels.has(level)) {
    redirect("/profile?error=Periksa nama dan level bermain Anda.");
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login?error=Silakan masuk kembali.");

  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName, level },
  });

  if (error) redirect("/profile?error=Profil belum tersimpan. Coba lagi.");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  redirect("/profile?message=Profil berhasil disimpan.");
}

export async function uploadAvatar(formData) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login?error=Silakan masuk kembali.");

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0 || file.size > 2 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    redirect("/profile?error=Gunakan foto JPG, PNG, atau WebP maksimal 2 MB.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const validJpeg = file.type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const validPng = file.type === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const validWebp = file.type === "image/webp" && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!validJpeg && !validPng && !validWebp) redirect("/profile?error=Format foto tidak valid.");

  const { error } = await supabase.storage.from("smashmate-avatars")
    .upload(`${user.id}/avatar`, bytes, { contentType: file.type, cacheControl: "3600", upsert: true });
  if (error) redirect("/profile?error=Foto belum tersimpan. Coba lagi.");

  const { error: metadataError } = await supabase.auth.updateUser({ data: { has_avatar: true } });
  if (metadataError) redirect("/profile?error=Foto tersimpan, tetapi profil belum diperbarui. Coba unggah lagi.");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  redirect("/profile?message=Foto profil berhasil diperbarui.");
}

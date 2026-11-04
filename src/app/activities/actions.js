"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlayerAccount } from "@/lib/account";

const kinds = new Set(["match", "coaching", "event"]);
const levels = new Set(["beginner", "intermediate", "professional", "all"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const errorUrl = (message) => `/activities?view=create&error=${encodeURIComponent(message)}`;

export async function createActivity(formData) {
  const { supabase, user, name } = await requirePlayerAccount();
  const kind = String(formData.get("kind") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  let location = String(formData.get("location") ?? "").trim();
  const level = String(formData.get("level") ?? "");
  const capacity = Number(formData.get("capacity"));
  const dateInput = String(formData.get("starts_at") ?? "");
  let startsAt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateInput)
    ? new Date(`${dateInput}:00+07:00`) : new Date(NaN);
  const bookingId = String(formData.get("booking_id") ?? "");
  const communityId = String(formData.get("community_id") ?? "");
  const opponentId = String(formData.get("sparring_opponent_id") ?? "");

  if ((bookingId && !uuidPattern.test(bookingId)) || (communityId && !uuidPattern.test(communityId))) {
    redirect(errorUrl("Booking atau komunitas tidak valid."));
  }
  if (opponentId && (!uuidPattern.test(opponentId) || !communityId || opponentId === communityId || kind !== "event")) redirect(errorUrl("Komunitas lawan tidak valid."));
  if (bookingId) {
    const { data: existingActivity } = await supabase.from("activities")
      .select("id").eq("booking_id", bookingId).limit(1).maybeSingle();
    if (existingActivity) redirect(errorUrl("Booking ini sudah digunakan untuk aktivitas lain."));
    const { data: booking } = await supabase.from("court_bookings")
      .select("starts_at,status,venues(name,address),courts(name)")
      .eq("id", bookingId).eq("player_id", user.id).maybeSingle();
    if (!booking || booking.status !== "confirmed") redirect(errorUrl("Booking harus sudah dikonfirmasi."));
    startsAt = new Date(booking.starts_at);
    location = `${booking.venues?.name ?? "GOR"} · ${booking.courts?.name ?? "Lapangan"}`.slice(0, 160);
  }
  if (communityId) {
    const { data: community } = await supabase.from("communities").select("id,owner_id,community_members(user_id,role)").eq("id", communityId).maybeSingle();
    if (!community || (community.owner_id !== user.id && !community.community_members?.some((member) => member.user_id === user.id && member.role === "admin"))) redirect(errorUrl("Hanya pendiri atau admin dapat membuat kegiatan komunitas."));
  }
  if (opponentId) {
    const { data: opponent } = await supabase.from("communities").select("id").eq("id", opponentId).maybeSingle();
    if (!opponent) redirect(errorUrl("Komunitas lawan tidak ditemukan."));
  }

  if (!kinds.has(kind) || !levels.has(level) || title.length < 5 || title.length > 100 ||
      description.length > 1000 || location.length < 3 || location.length > 160 ||
      !Number.isInteger(capacity) || capacity < 2 || capacity > 100 ||
      !Number.isFinite(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
    redirect(errorUrl("Periksa judul, lokasi, waktu, kapasitas, dan level aktivitas."));
  }

  const { data: createdActivity, error } = await supabase.from("activities").insert({
    host_id: user.id,
    host_name: name.slice(0, 60),
    kind,
    title,
    description,
    location,
    level,
    capacity,
    starts_at: startsAt.toISOString(),
    booking_id: bookingId || null,
    community_id: communityId || null,
    sparring_opponent_id: opponentId || null,
  }).select("id").single();
  if (error || !createdActivity) redirect(errorUrl("Aktivitas belum tersimpan. Coba lagi."));
  revalidatePath("/activities");
  if (communityId) revalidatePath(`/communities/${communityId}`);
  if (opponentId) revalidatePath(`/communities/${opponentId}`);
  redirect(`/activities/${createdActivity.id}`);
}

export async function joinActivity(_previousState, formData) {
  const { supabase } = await requirePlayerAccount();
  const id = String(formData.get("id") ?? "");
  if (!uuidPattern.test(id)) return { error: "Aktivitas tidak valid.", success: false };
  const { error } = await supabase.rpc("join_activity", { p_activity_id: id });
  if (error) return { error: "Tidak dapat bergabung. Periksa ketersediaan slot.", success: false };
  revalidatePath("/activities");
  revalidatePath(`/activities/${id}`);
  return { error: "", success: true };
}

export async function leaveActivity(_previousState, formData) {
  const { supabase, user } = await requirePlayerAccount();
  const id = String(formData.get("id") ?? "");
  if (!uuidPattern.test(id)) return { error: "Aktivitas tidak valid.", success: false };
  const { data, error } = await supabase.from("activity_participants").delete()
    .eq("activity_id", id).eq("user_id", user.id).select("activity_id").maybeSingle();
  if (error || !data) return { error: "Belum dapat keluar dari aktivitas.", success: false };
  revalidatePath("/activities");
  revalidatePath(`/activities/${id}`);
  return { error: "", success: true };
}

export async function deleteActivity(formData) {
  const { supabase, user } = await requirePlayerAccount();
  const id = String(formData.get("id") ?? "");
  if (!uuidPattern.test(id)) redirect("/activities?view=mine&error=Aktivitas%20tidak%20valid.");
  const { error } = await supabase.from("activities").delete().eq("id", id).eq("host_id", user.id);
  if (error) redirect("/activities?view=mine&error=Aktivitas%20belum%20dapat%20dihapus.");
  revalidatePath("/activities");
  redirect("/activities?view=mine&message=Aktivitas%20dihapus.");
}

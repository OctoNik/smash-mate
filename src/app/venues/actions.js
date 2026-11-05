"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlayerAccount } from "@/lib/account";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const errorUrl = (message, venueId) => venueId && uuid.test(venueId)
  ? `/venues/${venueId}?error=${encodeURIComponent(message)}`
  : `/bookings?error=${encodeURIComponent(message)}`;

export async function bookCourt(formData) {
  const { supabase } = await requirePlayerAccount();
  const venueId = String(formData.get("venue_id") ?? "");
  const courtId = String(formData.get("court_id") ?? "");
  const dateInput = String(formData.get("starts_at") ?? "");
  const duration = Number(formData.get("duration"));
  let items;
  try { items = JSON.parse(String(formData.get("items_json") ?? "[]")); } catch { items = null; }
  const startsAt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateInput)
    ? new Date(`${dateInput}:00+07:00`) : new Date(NaN);
  if (!uuid.test(courtId) || !Number.isInteger(duration) || duration < 60 || duration > 480 || duration % 60 !== 0 ||
    !Number.isFinite(startsAt.getTime()) || startsAt.getTime() <= Date.now() ||
    !Array.isArray(items) || items.length > 20 ||
    items.some((item) => !item || !uuid.test(item.product_id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) ||
    new Set(items.map((item) => item.product_id)).size !== items.length) {
    redirect(errorUrl("Periksa jadwal, durasi, dan jumlah perlengkapan.", venueId));
  }
  const { data: bookingId, error } = await supabase.rpc("book_court_with_items", {
    p_court_id: courtId,
    p_starts_at: startsAt.toISOString(),
    p_duration_minutes: duration,
    p_items: items,
  });
  if (error || !uuid.test(bookingId ?? "")) redirect(errorUrl("Slot atau stok tidak tersedia. Pilih jadwal/perlengkapan lain.", venueId));
  revalidatePath("/bookings");
  revalidatePath(`/venues/${venueId}`);
  redirect(`/bookings?checkout=${bookingId}&message=Booking%20dibuat.%20Selesaikan%20checkout%20simulasi.`);
}

async function runBookingAction(formData, functionName, successMessage) {
  const { supabase } = await requirePlayerAccount();
  const id = String(formData.get("id") ?? "");
  if (!uuid.test(id)) redirect(errorUrl("Booking tidak valid."));
  const { error } = await supabase.rpc(functionName, { p_booking_id: id });
  if (error) redirect(errorUrl(functionName === "cancel_court_booking"
    ? "Booking belum dapat dibatalkan. Batalkan aktivitas atau undangan sparring yang terkait terlebih dahulu."
    : "Booking belum dapat diproses."));
  revalidatePath("/bookings");
  redirect(`/bookings?checkout=${id}&message=${encodeURIComponent(successMessage)}`);
}

export async function payBooking(formData) {
  return runBookingAction(formData, "demo_pay_booking", "Pembayaran simulasi berhasil. Booking dikonfirmasi.");
}
export async function cancelBooking(formData) {
  return runBookingAction(formData, "cancel_court_booking", "Booking dibatalkan.");
}

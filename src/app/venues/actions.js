"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/account";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const errorUrl = (message, venueId) => venueId && uuid.test(venueId)
  ? `/venues/${venueId}?error=${encodeURIComponent(message)}`
  : `/bookings?error=${encodeURIComponent(message)}`;

export async function bookCourt(formData) {
  const { supabase } = await requireAccount();
  const venueId = String(formData.get("venue_id") ?? "");
  const courtId = String(formData.get("court_id") ?? "");
  const dateInput = String(formData.get("starts_at") ?? "");
  const duration = Number(formData.get("duration"));
  const racketId = String(formData.get("racket_id") ?? "");
  const racketQuantity = Number(formData.get("racket_quantity") ?? 0);
  const shuttleId = String(formData.get("shuttle_id") ?? "");
  const shuttleQuantity = Number(formData.get("shuttle_quantity") ?? 0);
  const startsAt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateInput)
    ? new Date(`${dateInput}:00+07:00`) : new Date(NaN);
  if (!uuid.test(courtId) || ![60, 120].includes(duration) ||
    !Number.isFinite(startsAt.getTime()) || startsAt.getTime() <= Date.now() ||
    !Number.isInteger(racketQuantity) || racketQuantity < 0 || racketQuantity > 20 ||
    !Number.isInteger(shuttleQuantity) || shuttleQuantity < 0 || shuttleQuantity > 100 ||
    (racketQuantity > 0 && !uuid.test(racketId)) ||
    (shuttleQuantity > 0 && !uuid.test(shuttleId))) {
    redirect(errorUrl("Periksa jadwal, durasi, dan jumlah perlengkapan.", venueId));
  }
  const { error } = await supabase.rpc("book_court", {
    p_court_id: courtId,
    p_starts_at: startsAt.toISOString(),
    p_duration_minutes: duration,
    p_racket_product_id: racketQuantity ? racketId : null,
    p_racket_quantity: racketQuantity,
    p_shuttle_product_id: shuttleQuantity ? shuttleId : null,
    p_shuttle_quantity: shuttleQuantity,
  });
  if (error) redirect(errorUrl("Slot atau stok tidak tersedia. Pilih jadwal/perlengkapan lain.", venueId));
  revalidatePath("/bookings");
  revalidatePath(`/venues/${venueId}`);
  redirect("/bookings?message=Booking dibuat. Selesaikan pembayaran simulasi.");
}

export async function orderShuttlecock(formData) {
  const { supabase } = await requireAccount();
  const productId = String(formData.get("product_id") ?? "");
  const venueId = String(formData.get("venue_id") ?? "");
  const quantity = Number(formData.get("quantity"));
  if (!uuid.test(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    redirect(errorUrl("Jumlah produk tidak valid.", venueId));
  }
  const { error } = await supabase.rpc("purchase_shuttlecock", {
    p_product_id: productId, p_quantity: quantity,
  });
  if (error) redirect(errorUrl("Stok shuttlecock tidak mencukupi.", venueId));
  revalidatePath("/bookings");
  revalidatePath(`/venues/${venueId}`);
  redirect("/bookings?message=Pesanan dibuat. Selesaikan pembayaran simulasi.");
}

async function runBookingAction(formData, functionName, successMessage) {
  const { supabase } = await requireAccount();
  const id = String(formData.get("id") ?? "");
  if (!uuid.test(id)) redirect(errorUrl("Booking tidak valid."));
  const { error } = await supabase.rpc(functionName, { p_booking_id: id });
  if (error) redirect(errorUrl(functionName === "cancel_court_booking"
    ? "Booking belum dapat dibatalkan. Jika terkait aktivitas, hapus aktivitasnya terlebih dahulu."
    : "Booking belum dapat diproses."));
  revalidatePath("/bookings");
  redirect(`/bookings?message=${encodeURIComponent(successMessage)}`);
}

export async function payBooking(formData) {
  return runBookingAction(formData, "demo_pay_booking", "Pembayaran simulasi berhasil. Booking dikonfirmasi.");
}
export async function cancelBooking(formData) {
  return runBookingAction(formData, "cancel_court_booking", "Booking dibatalkan.");
}

async function runOrderAction(formData, functionName, successMessage) {
  const { supabase } = await requireAccount();
  const id = String(formData.get("id") ?? "");
  if (!uuid.test(id)) redirect(errorUrl("Pesanan tidak valid."));
  const { error } = await supabase.rpc(functionName, { p_order_id: id });
  if (error) redirect(errorUrl("Pesanan belum dapat diproses."));
  revalidatePath("/bookings");
  redirect(`/bookings?message=${encodeURIComponent(successMessage)}`);
}

export async function payOrder(formData) {
  return runOrderAction(formData, "demo_pay_order", "Pembayaran simulasi berhasil. Pesanan dikonfirmasi.");
}
export async function cancelOrder(formData) {
  return runOrderAction(formData, "cancel_venue_order", "Pesanan dibatalkan.");
}

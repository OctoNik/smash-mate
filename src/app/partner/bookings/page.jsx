import { redirect } from "next/navigation";
import AccountHeader from "@/components/account-header";
import { requireAccount } from "@/lib/account";
import { rupiah, waktuWib } from "@/lib/format";

export const instant = false;
const labels = { pending_payment: "Menunggu checkout", confirmed: "Dikonfirmasi", cancelled: "Dibatalkan" };

export default async function PartnerBookingsPage() {
  const { supabase, user, name } = await requireAccount();
  if (user.app_metadata?.smashmate_role !== "partner") redirect("/dashboard");
  const { data: venue } = await supabase.from("venues").select("id,name,status").eq("owner_id", user.id).order("created_at").limit(1).maybeSingle();
  if (!venue) redirect("/partner");
  if (venue.status === "draft") redirect("/partner/setup");
  const { data: bookings, error } = await supabase.from("court_bookings")
    .select("id,player_name,starts_at,ends_at,total_amount,status,racket_quantity,shuttle_quantity,courts(name),court_booking_items(product_id,product_name,quantity,kind)")
    .eq("venue_id", venue.id).order("starts_at", { ascending: false }).limit(100);
  const active = (bookings ?? []).filter((booking) => booking.status !== "cancelled");
  const confirmed = active.filter((booking) => booking.status === "confirmed");
  return <div className="dashboard-shell min-h-screen"><AccountHeader name={name} email={user.email ?? ""} user={user} active="partner-bookings" />
    <main className="shell py-10 sm:py-14"><p className="eyebrow">Mitra GOR</p><h1 className="font-display text-3xl font-extrabold sm:text-4xl">Dashboard Booking</h1><p className="mt-3 text-sm text-court-950/65">Booking lapangan dan perlengkapan di {venue.name}. Pembayaran pada prototipe ini adalah simulasi.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-3"><div className="dashboard-card p-5"><p className="text-xs text-court-950/60">Booking aktif</p><strong className="mt-2 block text-2xl">{active.length}</strong></div><div className="dashboard-card p-5"><p className="text-xs text-court-950/60">Dikonfirmasi</p><strong className="mt-2 block text-2xl">{confirmed.length}</strong></div><div className="dashboard-card p-5"><p className="text-xs text-court-950/60">Menunggu checkout</p><strong className="mt-2 block text-2xl">{active.length - confirmed.length}</strong></div></div>
      {error && <p role="alert" className="profile-message error">Daftar booking belum dapat dimuat.</p>}
      <section className="mt-9" aria-labelledby="orders-heading"><h2 id="orders-heading" className="text-xl font-extrabold">Daftar booking</h2><div className="mt-4 grid gap-4 lg:grid-cols-2">{!error && !(bookings ?? []).length && <p className="dashboard-card p-5 text-sm text-court-950/65">Belum ada booking.</p>}{(bookings ?? []).map((booking) => <article className="dashboard-card p-5" key={booking.id}><div className="flex items-start justify-between gap-3"><div><h3 className="font-extrabold">{booking.courts?.name}</h3><p className="mt-1 text-sm">Atas nama {booking.player_name}</p></div><span className="activity-tag">{labels[booking.status] ?? booking.status}</span></div><p className="mt-3 text-sm text-court-950/65">{waktuWib(booking.starts_at)} – {new Date(booking.ends_at).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })} WIB</p><p className="mt-2 font-bold text-court-red">{rupiah(booking.total_amount)}</p>{booking.court_booking_items?.length ? <ul className="mt-3 space-y-1 border-t border-court-950/10 pt-3 text-xs text-court-950/65">{booking.court_booking_items.map((item) => <li key={item.product_id}>{item.quantity} × {item.product_name} ({item.kind === "racket_rental" ? "sewa" : "beli"})</li>)}</ul> : (booking.racket_quantity > 0 || booking.shuttle_quantity > 0) && <p className="mt-3 border-t border-court-950/10 pt-3 text-xs text-court-950/65">Raket sewa: {booking.racket_quantity} · Shuttlecock: {booking.shuttle_quantity} slop</p>}</article>)}</div></section>
    </main></div>;
}

import Link from "next/link";
import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { requireAccount } from "@/lib/account";
import { rupiah, waktuWib } from "@/lib/format";
import { payBooking, cancelBooking } from "@/app/venues/actions";

export const instant = false;
const statusLabels = { pending_payment: "Menunggu checkout simulasi", confirmed: "Dikonfirmasi (simulasi)", cancelled: "Dibatalkan" };

export default async function BookingsPage({ searchParams }) {
  const { supabase, user, name } = await requireAccount();
  const { message, error } = await searchParams;
  const { data: bookings, error: bookingError } = await supabase.from("court_bookings")
      .select("id,starts_at,ends_at,total_amount,status,racket_quantity,shuttle_quantity,venues(name),courts(name)")
      .eq("player_id", user.id).order("created_at", { ascending: false }).limit(30);
  const bookingIds = (bookings ?? []).map((booking) => booking.id);
  const { data: linkedActivities } = bookingIds.length
    ? await supabase.from("activities").select("booking_id").in("booking_id", bookingIds)
    : { data: [] };
  const usedBookingIds = new Set((linkedActivities ?? []).map((activity) => activity.booking_id));
  return <div className="dashboard-shell min-h-screen">
    <AccountHeader name={name} email={user.email ?? ""} user={user} active="bookings" />
    <main className="shell max-w-6xl py-10 sm:py-14">
      <p className="eyebrow">Pesanan saya</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Booking & checkout</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-court-950/65">Host membayar lapangan, sewa raket, dan shuttlecock dalam satu booking. Pembayaran pada prototipe ini adalah simulasi.</p>
      {message && <p role="status" className="profile-message success">{message}</p>}
      {error && <p role="alert" className="profile-message error">{error}</p>}
      {bookingError && <p role="alert" className="profile-message error">Riwayat booking belum dapat dimuat.</p>}
      <section className="mt-9" aria-labelledby="bookings-title">
        <div className="flex items-end justify-between gap-3"><h2 id="bookings-title" className="text-xl font-extrabold">Booking lapangan</h2><Link href="/venues" className="text-sm font-bold text-court-700 hover:underline">Cari GOR</Link></div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {(bookings ?? []).length === 0 && <p className="dashboard-card p-6 text-sm text-court-950/65">Anda belum memesan lapangan.</p>}
          {(bookings ?? []).map((booking) => <article className="dashboard-card p-6" key={booking.id}>
            <span className="activity-tag">{statusLabels[booking.status] ?? booking.status}</span>
            <h3 className="mt-4 text-lg font-extrabold">{booking.venues?.name} · {booking.courts?.name}</h3>
            <p className="mt-2 text-sm text-court-950/65">{waktuWib(booking.starts_at)} – {new Date(booking.ends_at).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })} WIB</p>
            {(booking.racket_quantity > 0 || booking.shuttle_quantity > 0) && <p className="mt-2 text-xs text-court-950/60">Raket sewa: {booking.racket_quantity} · Shuttlecock: {booking.shuttle_quantity} slop</p>}
            <p className="mt-4 text-xl font-extrabold text-court-700">{rupiah(booking.total_amount)}</p>
            {booking.status !== "cancelled" && <div className="mt-5 flex flex-wrap gap-3">
              {booking.status === "pending_payment" && <form action={payBooking}><input type="hidden" name="id" value={booking.id} /><SubmitButton className="btn btn-dark" pendingText="Mengonfirmasi...">Konfirmasi pembayaran simulasi</SubmitButton></form>}
              {booking.status === "confirmed" && !usedBookingIds.has(booking.id) && <Link href={`/activities?booking_id=${booking.id}#new`} className="btn btn-dark">Buat aktivitas dari booking</Link>}
              {booking.status === "confirmed" && usedBookingIds.has(booking.id) && <Link href="/activities" className="btn btn-outline-dark">Lihat aktivitas</Link>}
              <form action={cancelBooking}><input type="hidden" name="id" value={booking.id} /><SubmitButton className="btn btn-outline-dark" pendingText="Membatalkan..." confirmMessage="Batalkan booking ini?">Batalkan</SubmitButton></form>
            </div>}
          </article>)}
        </div>
      </section>
    </main>
  </div>;
}

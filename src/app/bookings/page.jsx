import Link from "next/link";
import { connection } from "next/server";
import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { requirePlayerAccount } from "@/lib/account";
import { rupiah, waktuWib } from "@/lib/format";
import { payBooking, cancelBooking } from "@/app/venues/actions";

export const instant = false;
const statusLabels = { pending_payment: "Menunggu checkout simulasi", confirmed: "Dikonfirmasi (simulasi)", cancelled: "Dibatalkan" };
const bookingStatus = (booking) => booking.cancelled_reason === "expired" ? "Checkout kedaluwarsa" : statusLabels[booking.status] ?? booking.status;
function Equipment({ booking }) {
  const items = booking.court_booking_items ?? [];
  if (items.length) return <ul className="mt-2 space-y-1 text-sm text-court-950/70">{items.map((item) => <li key={item.product_id}>{item.quantity} × {item.product_name} <span className="text-court-950/50">({item.kind === "racket_rental" ? "sewa raket" : "shuttlecock"})</span> · {rupiah(item.unit_price * item.quantity)}</li>)}</ul>;
  if (booking.racket_quantity > 0 || booking.shuttle_quantity > 0) return <p className="mt-2 text-sm text-court-950/70">Raket sewa: {booking.racket_quantity} · Shuttlecock: {booking.shuttle_quantity} slop</p>;
  return <p className="mt-2 text-sm text-court-950/60">Tanpa perlengkapan tambahan.</p>;
}

function BookingActions({ booking, activityId, expired, started }) {
  if (booking.status === "cancelled") return null;
  return <div className="mt-5 flex flex-wrap gap-3 border-t border-court-950/10 pt-5">
    {booking.status === "pending_payment" && expired && <p className="w-full text-sm text-court-950/70">Jadwal ini sudah lewat. Booking tidak dapat dikonfirmasi; pilih jadwal baru di GOR.</p>}
    {booking.status === "pending_payment" && !expired && <form action={payBooking}><input type="hidden" name="id" value={booking.id} /><SubmitButton className="btn btn-dark" pendingText="Mengonfirmasi...">Konfirmasi checkout simulasi</SubmitButton></form>}
    {booking.status === "confirmed" && started && <p className="w-full text-sm text-court-950/70">Jadwal bermain sudah dimulai. Booking tidak dapat dibatalkan atau dijadikan mabar baru.</p>}
    {booking.status === "confirmed" && !started && !activityId && <Link href={`/activities?view=create&booking_id=${booking.id}#new`} className="btn btn-dark">Buat mabar dari booking</Link>}
    {booking.status === "confirmed" && activityId && <Link href={`/activities/${activityId}`} className="btn btn-outline-dark">Lihat aktivitas</Link>}
    {!started && <form action={cancelBooking}><input type="hidden" name="id" value={booking.id} /><SubmitButton className="btn btn-outline-dark" pendingText="Membatalkan..." confirmMessage="Batalkan booking ini?">Batalkan</SubmitButton></form>}
  </div>;
}

function BookingCard({ booking, activityId, expired, started }) {
  return <article className="dashboard-card p-6">
    <span className="activity-tag">{expired ? "Jadwal lewat" : bookingStatus(booking)}</span>
    <h3 className="mt-4 text-lg font-extrabold">{booking.venues?.name} · {booking.courts?.name}</h3>
    <p className="mt-2 text-sm text-court-950/65">{waktuWib(booking.starts_at)} – {new Date(booking.ends_at).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })} WIB</p>
    <Equipment booking={booking} />
    <p className="mt-4 text-xl font-extrabold text-court-700">{rupiah(booking.total_amount)}</p>
    <BookingActions booking={booking} activityId={activityId} expired={expired} started={started} />
  </article>;
}

export default async function BookingsPage({ searchParams }) {
  await connection();
  const { supabase, user, name } = await requirePlayerAccount();
  const { message, error, checkout } = await searchParams;
  const { data: bookings, error: bookingError } = await supabase.from("court_bookings")
      .select("id,player_name,starts_at,ends_at,total_amount,status,cancelled_reason,racket_quantity,shuttle_quantity,venues(id,name,address),courts(name),court_booking_items(product_id,kind,product_name,quantity,unit_price)")
      .eq("player_id", user.id).order("created_at", { ascending: false }).limit(30);
  const bookingIds = (bookings ?? []).map((booking) => booking.id);
  const { data: linkedActivities } = bookingIds.length
    ? await supabase.from("activities").select("id,booking_id").in("booking_id", bookingIds).is("cancelled_at", null)
    : { data: [] };
  const activitiesByBooking = new Map((linkedActivities ?? []).map((activity) => [activity.booking_id, activity.id]));
  // connection() above makes this a request-time value for the booking status.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const isExpired = (booking) => booking.status === "pending_payment" && new Date(booking.starts_at).getTime() <= now;
  const hasStarted = (booking) => new Date(booking.starts_at).getTime() <= now;
  const selectedBooking = (bookings ?? []).find((booking) => booking.id === checkout);
  const historyBookings = (bookings ?? []).filter((booking) => booking.id !== selectedBooking?.id);
  return <div className="dashboard-shell min-h-screen">
    <AccountHeader name={name} email={user.email ?? ""} user={user} active="bookings" />
    <main className="shell max-w-6xl py-10 sm:py-14">
      <p className="eyebrow">Pesanan saya</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Booking saya</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-court-950/65">Tinjau lapangan dan perlengkapan, konfirmasi checkout simulasi, lalu buka mabar untuk pemain lain.</p>
      {message && <p role="status" className="profile-message success">{message}</p>}
      {error && <p role="alert" className="profile-message error">{error}</p>}
      {bookingError && <p role="alert" className="profile-message error">Riwayat booking belum dapat dimuat.</p>}
      {selectedBooking && <section className="mt-9 grid items-start gap-5 lg:grid-cols-[1.2fr_.8fr]" aria-labelledby="checkout-title">
        <div className="dashboard-card p-6 sm:p-8">
          <p className="eyebrow">Booking terpilih</p>
          <h2 id="checkout-title" className="mt-2 font-display text-2xl font-extrabold">{selectedBooking.status === "pending_payment" ? "Tinjau sebelum checkout" : "Detail booking"}</h2>
          <div className="mt-6 border-t border-court-950/10 pt-5"><h3 className="text-sm font-extrabold">Penyewa</h3><p className="mt-2 text-sm">{selectedBooking.player_name} · {user.email}</p></div>
          <div className="mt-5 border-t border-court-950/10 pt-5"><h3 className="text-sm font-extrabold">GOR dan lapangan</h3><p className="mt-2 font-bold">{selectedBooking.venues?.name} · {selectedBooking.courts?.name}</p><p className="mt-1 text-sm text-court-950/65">{selectedBooking.venues?.address}</p>{selectedBooking.venues?.id && <Link href={`/venues/${selectedBooking.venues.id}`} className="mt-2 inline-block text-xs font-bold text-court-700 hover:underline">Lihat GOR</Link>}</div>
          <div className="mt-5 border-t border-court-950/10 pt-5"><h3 className="text-sm font-extrabold">Jadwal bermain</h3><p className="mt-2 text-sm">{waktuWib(selectedBooking.starts_at)} – {new Date(selectedBooking.ends_at).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })} WIB</p></div>
          <div className="mt-5 border-t border-court-950/10 pt-5"><h3 className="text-sm font-extrabold">Perlengkapan</h3><Equipment booking={selectedBooking} /></div>
        </div>
        <aside className="dashboard-card p-6 sm:p-8">
          <span className="activity-tag">{isExpired(selectedBooking) ? "Jadwal lewat" : bookingStatus(selectedBooking)}</span>
          <p className="mt-6 text-sm text-court-950/65">Total booking</p>
          <p className="mt-1 font-display text-3xl font-extrabold">{rupiah(selectedBooking.total_amount)}</p>
          <p className="mt-3 text-xs leading-6 text-court-950/60">Checkout ini hanya simulasi. Tidak ada metode pembayaran atau penagihan uang sungguhan.</p>
          <BookingActions booking={selectedBooking} activityId={activitiesByBooking.get(selectedBooking.id)} expired={isExpired(selectedBooking)} started={hasStarted(selectedBooking)} />
        </aside>
      </section>}
      {!selectedBooking && <section className="mt-9" aria-labelledby="bookings-title">
        <div className="flex items-end justify-between gap-3"><h2 id="bookings-title" className="text-xl font-extrabold">Booking lapangan</h2><Link href="/venues" className="text-sm font-bold text-court-700 hover:underline">Cari GOR</Link></div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {historyBookings.length === 0 && <p className="dashboard-card p-6 text-sm text-court-950/65">Anda belum memesan lapangan.</p>}
          {historyBookings.map((booking) => <BookingCard booking={booking} activityId={activitiesByBooking.get(booking.id)} expired={isExpired(booking)} started={hasStarted(booking)} key={booking.id} />)}
        </div>
      </section>}
    </main>
  </div>;
}

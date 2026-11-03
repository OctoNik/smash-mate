import Link from "next/link";
import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { requireAccount } from "@/lib/account";
import { rupiah, waktuWib } from "@/lib/format";
import { payBooking, cancelBooking, payOrder, cancelOrder } from "@/app/venues/actions";

export const instant = false;
const statusLabels = { pending_payment: "Menunggu checkout simulasi", confirmed: "Dikonfirmasi (simulasi)", cancelled: "Dibatalkan" };

export default async function BookingsPage({ searchParams }) {
  const { supabase, user, name } = await requireAccount();
  const { message, error } = await searchParams;
  const [{ data: bookings, error: bookingError }, { data: orders, error: orderError }] = await Promise.all([
    supabase.from("court_bookings")
      .select("id,starts_at,ends_at,total_amount,status,racket_quantity,shuttle_quantity,venues(name),courts(name)")
      .eq("player_id", user.id).order("created_at", { ascending: false }).limit(30),
    supabase.from("venue_orders")
      .select("id,quantity,total_amount,status,created_at,venues(name),venue_products(name)")
      .eq("player_id", user.id).order("created_at", { ascending: false }).limit(30),
  ]);
  return <div className="dashboard-shell min-h-screen">
    <AccountHeader name={name} email={user.email ?? ""} user={user} active="bookings" />
    <main className="shell max-w-6xl py-10 sm:py-14">
      <p className="eyebrow">Pesanan saya</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Booking & checkout</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-court-950/65">Seluruh pembayaran pada prototipe ini adalah simulasi. Tidak ada uang yang ditagih atau dikirim.</p>
      {message && <p role="status" className="profile-message success">{message}</p>}
      {error && <p role="alert" className="profile-message error">{error}</p>}
      {(bookingError || orderError) && <p role="alert" className="profile-message error">Riwayat pesanan belum dapat dimuat.</p>}
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
              <form action={cancelBooking}><input type="hidden" name="id" value={booking.id} /><SubmitButton className="btn btn-outline-dark" pendingText="Membatalkan..." confirmMessage="Batalkan booking ini?">Batalkan</SubmitButton></form>
            </div>}
          </article>)}
        </div>
      </section>
      <section className="mt-12" aria-labelledby="orders-title">
        <h2 id="orders-title" className="text-xl font-extrabold">Pembelian shuttlecock</h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {(orders ?? []).length === 0 && <p className="dashboard-card p-6 text-sm text-court-950/65">Anda belum memesan shuttlecock.</p>}
          {(orders ?? []).map((order) => <article className="dashboard-card p-6" key={order.id}>
            <span className="activity-tag">{statusLabels[order.status] ?? order.status}</span>
            <h3 className="mt-4 text-lg font-extrabold">{order.venue_products?.name}</h3>
            <p className="mt-2 text-sm text-court-950/65">{order.venues?.name} · {order.quantity} slop</p>
            <p className="mt-4 text-xl font-extrabold text-court-700">{rupiah(order.total_amount)}</p>
            {order.status !== "cancelled" && <div className="mt-5 flex flex-wrap gap-3">
              {order.status === "pending_payment" && <form action={payOrder}><input type="hidden" name="id" value={order.id} /><SubmitButton className="btn btn-dark" pendingText="Mengonfirmasi...">Konfirmasi pembayaran simulasi</SubmitButton></form>}
              <form action={cancelOrder}><input type="hidden" name="id" value={order.id} /><SubmitButton className="btn btn-outline-dark" pendingText="Membatalkan..." confirmMessage="Batalkan pesanan ini?">Batalkan</SubmitButton></form>
            </div>}
          </article>)}
        </div>
      </section>
    </main>
  </div>;
}

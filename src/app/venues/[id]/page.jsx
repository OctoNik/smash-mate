import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { requireAccount } from "@/lib/account";
import { rupiah, waktuWib } from "@/lib/format";
import { bookCourt } from "../actions";

export const instant = false;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function VenueDetailPage({ params, searchParams }) {
  await connection();
  const { supabase, user, name } = await requireAccount();
  const { id } = await params;
  if (!uuid.test(id)) notFound();
  const { error } = await searchParams;
  const { data: venue } = await supabase.from("venues")
    .select("id,name,description,address,maps_url,contact_phone,open_time,close_time,status")
    .eq("id", id).eq("status", "active").maybeSingle();
  if (!venue) notFound();
  const [{ data: courts }, { data: products }, { data: bookings }] = await Promise.all([
    supabase.from("courts").select("id,name,price_per_hour,is_active").eq("venue_id", id).eq("is_active", true).order("name"),
    supabase.from("venue_products").select("id,kind,name,description,price,stock,image_path,is_active")
      .eq("venue_id", id).eq("is_active", true).order("created_at"),
    supabase.rpc("venue_busy_slots", { p_venue_id: id }),
  ]);
  const rentals = (products ?? []).filter((product) => product.kind === "racket_rental" && product.stock > 0);
  const shuttles = (products ?? []).filter((product) => product.kind === "shuttlecock_sale" && product.stock > 0);

  return (
    <div className="dashboard-shell min-h-screen">
      <AccountHeader name={name} email={user.email ?? ""} user={user} active="venues" />
      <main className="shell py-10 sm:py-14">
        <Link href="/venues" className="text-sm font-bold text-court-700 hover:underline">Semua GOR</Link>
        <p className="eyebrow mt-7">Mitra GOR</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{venue.name}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-court-950/70">{venue.description || "Lapangan badminton mitra SmashMate."}</p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-court-950/70"><span>{venue.address}</span><span>Buka {String(venue.open_time).slice(0, 5)}–{String(venue.close_time).slice(0, 5)} WIB</span>{venue.maps_url && <a href={venue.maps_url} target="_blank" rel="noopener noreferrer" className="font-bold text-court-700 hover:underline">Buka Google Maps</a>}</div>
        {error && <p role="alert" className="profile-message error">{error}</p>}
        <section className="mt-10" aria-labelledby="courts-title">
          <h2 id="courts-title" className="font-display text-2xl font-extrabold">Pilih lapangan</h2>
          <p className="mt-2 text-sm text-court-950/60">Host memesan lapangan dan perlengkapan untuk seluruh pemain. Peserta mabar cukup bergabung ke aktivitas. Waktu menggunakan WIB; pembayaran di sini adalah simulasi.</p>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {(courts ?? []).length === 0 && <p className="dashboard-card p-6 text-sm text-court-950/65">Belum ada lapangan yang dapat dipesan saat ini.</p>}
            {(courts ?? []).map((court) => <article className="dashboard-card p-6" key={court.id}>
              <div className="flex items-start justify-between gap-3"><h3 className="text-xl font-extrabold">{court.name}</h3><strong className="text-court-700">{rupiah(court.price_per_hour)} / jam</strong></div>
              <div className="mt-4 rounded-xl bg-court-cream p-4 text-xs leading-6 text-court-950/70">
                <strong>Jadwal terisi terdekat</strong>
                {(bookings ?? []).filter((booking) => booking.court_id === court.id).length
                  ? (bookings ?? []).filter((booking) => booking.court_id === court.id).slice(0, 5).map((booking) =>
                    <p key={booking.starts_at}>{waktuWib(booking.starts_at)} – {new Date(booking.ends_at).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })} WIB</p>)
                  : <p>Belum ada jadwal terisi.</p>}
              </div>
              <form action={bookCourt} className="mt-5 space-y-3">
                <input type="hidden" name="venue_id" value={venue.id} />
                <input type="hidden" name="court_id" value={court.id} />
                <label className="profile-label">Mulai (WIB)<input type="datetime-local" name="starts_at" required className="profile-input" /></label>
                <label className="profile-label">Durasi<select name="duration" className="profile-input"><option value="60">1 jam</option><option value="120">2 jam</option></select></label>
                {rentals.length > 0 && <div className="grid gap-2 sm:grid-cols-[1fr_110px]"><label className="profile-label">Sewa raket (opsional)<select name="racket_id" className="profile-input"><option value="">Tanpa raket</option>{rentals.map((product) => <option key={product.id} value={product.id}>{product.name} · {rupiah(product.price)} / sesi</option>)}</select></label><label className="profile-label">Jumlah<input type="number" name="racket_quantity" min="0" max="20" defaultValue="0" className="profile-input" /></label></div>}
                {shuttles.length > 0 && <div className="grid gap-2 sm:grid-cols-[1fr_110px]"><label className="profile-label">Beli shuttlecock (opsional, per slop)<select name="shuttle_id" className="profile-input"><option value="">Tanpa shuttlecock</option>{shuttles.map((product) => <option key={product.id} value={product.id}>{product.name} · {rupiah(product.price)} / slop</option>)}</select></label><label className="profile-label">Jumlah slop<input type="number" name="shuttle_quantity" min="0" max="100" defaultValue="0" className="profile-input" /></label></div>}
                <SubmitButton className="btn btn-dark w-full" pendingText="Memeriksa slot...">Pesan lapangan</SubmitButton>
              </form>
            </article>)}
          </div>
        </section>
        <section className="mt-12" aria-labelledby="catalog-title">
          <h2 id="catalog-title" className="font-display text-2xl font-extrabold">Katalog perlengkapan</h2>
          <p className="mt-2 text-sm text-court-950/60">Pilih perlengkapan dari katalog ini pada formulir booking lapangan di atas. Harga raket berlaku per sesi, sedangkan shuttlecock dijual per slop.</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(products ?? []).length === 0 && <p className="dashboard-card p-6 text-sm">Mitra ini belum menambahkan perlengkapan.</p>}
            {(products ?? []).map((product) => {
              const imageUrl = product.image_path ? supabase.storage.from("venue-products").getPublicUrl(product.image_path).data.publicUrl : null;
              return <article className="dashboard-card overflow-hidden" key={product.id}>
                <div className="grid h-44 place-items-center bg-court-cream bg-cover bg-center text-5xl" style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}>{imageUrl ? "" : "🏸"}</div>
                <div className="p-5"><span className="activity-tag">{product.kind === "racket_rental" ? "Sewa raket" : "Beli shuttlecock"}</span><h3 className="mt-3 font-extrabold">{product.name}</h3><p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-court-950/60">{product.description}</p><p className="mt-3 text-lg font-extrabold text-court-700">{rupiah(product.price)}<small className="text-xs"> / {product.kind === "racket_rental" ? "sesi" : "slop"}</small></p><p className="mt-1 text-xs text-court-950/60">Tersedia: {product.stock} {product.kind === "racket_rental" ? "raket" : "slop"}</p>
                <p className="mt-4 text-xs text-court-950/60">Tambahkan saat booking lapangan.</p></div>
              </article>;
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import AccountHeader from "@/components/account-header";
import VenueBookingFlow from "@/components/venue-booking-flow";
import { requirePlayerAccount } from "@/lib/account";
import { rupiah } from "@/lib/format";

export const instant = false;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function VenueDetailPage({ params, searchParams }) {
  await connection();
  const { supabase, user, name } = await requirePlayerAccount();
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
  const startingPrice = courts?.length ? Math.min(...courts.map((court) => court.price_per_hour)) : null;

  return (
    <div className="dashboard-shell min-h-screen">
      <AccountHeader name={name} email={user.email ?? ""} user={user} active="venues" />
      <main className="shell py-10 sm:py-14">
        <Link href="/venues" className="text-sm font-bold text-court-700 hover:underline">Semua GOR</Link>
        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1.3fr_.7fr]">
          <div>
            <p className="eyebrow">Mitra GOR · Badminton</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">{venue.name}</h1>
            <section className="mt-7 border-t border-court-950/10 pt-6" aria-labelledby="venue-description-title">
              <h2 id="venue-description-title" className="text-lg font-extrabold">Tentang GOR</h2>
              <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-7 text-court-950/70">{venue.description || "Lapangan badminton mitra SmashMate."}</p>
            </section>
            <section className="mt-7 rounded-xl bg-white p-5" aria-labelledby="venue-location-title">
              <h2 id="venue-location-title" className="text-sm font-extrabold">Lokasi GOR</h2>
              <p className="mt-2 text-sm text-court-950/70">{venue.address}</p>
              {venue.maps_url && <a href={venue.maps_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-bold text-court-700 hover:underline">Buka Google Maps</a>}
            </section>
          </div>
          <aside className="dashboard-card p-6">
            <p className="text-sm text-court-950/60">{startingPrice !== null ? "Mulai dari" : "Lapangan"}</p>
            <p className="mt-1 font-display text-3xl font-extrabold">{startingPrice !== null ? rupiah(startingPrice) : "Belum tersedia"}</p>
            {startingPrice !== null && <p className="mt-1 text-xs text-court-950/60">per jam · {courts.length} lapangan aktif</p>}
            <p className="mt-5 text-xs text-court-950/65">Buka {String(venue.open_time).slice(0, 5)}–{String(venue.close_time).slice(0, 5)} WIB</p>
            <a href="#booking" className="btn btn-dark mt-5 w-full">Cek ketersediaan</a>
          </aside>
        </div>
        {error && <p role="alert" className="profile-message error">{error}</p>}
        <section id="booking" className="mt-10 scroll-mt-28" aria-labelledby="courts-title">
          <h2 id="courts-title" className="font-display text-2xl font-extrabold">Pilih lapangan dan jadwal</h2>
          <p className="mt-2 text-sm text-court-950/60">Host memilih satu lapangan, lalu menambahkan raket dan shuttlecock jika diperlukan. Peserta mabar cukup bergabung ke aktivitas.</p>
          <VenueBookingFlow venueId={venue.id} courts={courts ?? []} rentals={rentals} shuttles={shuttles} busySlots={bookings ?? []} openTime={venue.open_time} closeTime={venue.close_time} />
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

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import AccountHeader from "@/components/account-header";
import VenueBookingFlow from "@/components/venue-booking-flow";
import VenuePhotoGallery from "@/components/venue-photo-gallery";
import { requirePlayerAccount } from "@/lib/account";
import { rupiah } from "@/lib/format";
import { sampleEquipmentImage, sampleVenueImage } from "@/lib/venue-images";

export const instant = false;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default async function VenueDetailPage({ params, searchParams }) {
  await connection();
  const { supabase, user, name } = await requirePlayerAccount();
  const { id } = await params;
  if (!uuid.test(id)) notFound();
  const { error } = await searchParams;
  const { data: venue } = await supabase.from("venues")
    .select("id,name,description,venue_rules,open_weekdays,address,maps_url,contact_phone,open_time,close_time,status")
    .eq("id", id).eq("status", "active").maybeSingle();
  if (!venue) notFound();
  const [{ data: courts }, { data: products }, { data: bookings }, { data: closures }, { data: photos }] = await Promise.all([
    supabase.from("courts").select("id,name,price_per_hour,is_active").eq("venue_id", id).eq("is_active", true).order("name"),
    supabase.from("venue_products").select("id,kind,name,description,price,stock,image_path,is_active")
      .eq("venue_id", id).eq("is_active", true).order("created_at"),
    supabase.rpc("venue_busy_slots", { p_venue_id: id }),
    supabase.from("venue_closures").select("starts_on,ends_on,reason").eq("venue_id", id).order("starts_on"),
    supabase.from("venue_photos").select("image_path,created_at").eq("venue_id", id).order("created_at"),
  ]);
  const availableProducts = (products ?? []).filter((product) => product.stock > 0).map((product) => ({
    ...product,
    imageUrl: product.image_path ? supabase.storage.from("venue-products").getPublicUrl(product.image_path).data.publicUrl : sampleEquipmentImage(product.kind, product.name),
    isSample: !product.image_path,
  }));
  const rentals = availableProducts.filter((product) => product.kind === "racket_rental");
  const shuttles = availableProducts.filter((product) => product.kind === "shuttlecock_sale");
  const startingPrice = courts?.length ? Math.min(...courts.map((court) => court.price_per_hour)) : null;
  const galleryPhotos = (photos ?? []).map((photo) => supabase.storage.from("venue-products").getPublicUrl(photo.image_path).data.publicUrl);

  return (
    <div className="dashboard-shell min-h-screen">
      <AccountHeader name={name} email={user.email ?? ""} user={user} active="venues" />
      <main className="shell py-10 sm:py-14">
        <Link href="/venues" className="text-sm font-bold text-court-700 hover:underline">Semua GOR</Link>
        <VenuePhotoGallery name={venue.name} photos={galleryPhotos} sample={sampleVenueImage(venue.id)} />
        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1.3fr_.7fr]">
          <div>
            <p className="eyebrow">Mitra GOR · Badminton</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">{venue.name}</h1>
            <section className="mt-7 border-t border-court-950/10 pt-6" aria-labelledby="venue-description-title">
              <h2 id="venue-description-title" className="text-lg font-extrabold">Deskripsi</h2>
              <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-7 text-court-950/70">{venue.description || "Mitra belum menambahkan deskripsi GOR."}</p>
              <p className="mt-4 text-sm font-semibold text-court-950/75">Buka {dayNames.filter((_, index) => venue.open_weekdays?.includes(index)).join(", ")} · {String(venue.open_time).slice(0, 5)}–{String(venue.close_time).slice(0, 5)} WIB</p>
            </section>
            <section className="mt-7 border-t border-court-950/10 pt-6" aria-labelledby="venue-rules-title">
              <h2 id="venue-rules-title" className="text-lg font-extrabold">Aturan GOR</h2>
              {venue.venue_rules ? venue.venue_rules.length > 280 ? <details className="group mt-3"><summary className="cursor-pointer list-none text-sm leading-7 text-court-950/70"><span className="whitespace-pre-line group-open:hidden">{venue.venue_rules.slice(0, 280).trimEnd()}…</span><span className="mt-1 block font-bold text-court-red group-open:hidden">Baca selengkapnya</span><span className="hidden whitespace-pre-line group-open:block">{venue.venue_rules}</span><span className="mt-2 hidden font-bold text-court-red group-open:block">Tutup aturan</span></summary></details> : <p className="mt-3 whitespace-pre-line text-sm leading-7 text-court-950/70">{venue.venue_rules}</p> : <p className="mt-3 text-sm text-court-950/60">Mitra belum menambahkan aturan khusus.</p>}
            </section>
            <section className="mt-7 overflow-hidden rounded-2xl border border-court-950/10 bg-white" aria-labelledby="venue-location-title">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6"><div><h2 id="venue-location-title" className="text-lg font-extrabold">Lokasi GOR</h2><p className="mt-2 max-w-xl text-sm leading-6 text-court-950/70">{venue.address}</p></div>{venue.maps_url && <a href={venue.maps_url} target="_blank" rel="noopener noreferrer" className="btn btn-dark shrink-0">Buka peta <span aria-hidden="true">↗</span></a>}</div>
              <div className="relative h-24 overflow-hidden border-t border-court-950/10 bg-court-cream" aria-hidden="true" style={{ backgroundImage: "linear-gradient(30deg, transparent 45%, #d9e3e8 46%, #d9e3e8 49%, transparent 50%), linear-gradient(115deg, transparent 43%, #d9e3e8 44%, #d9e3e8 48%, transparent 49%), linear-gradient(0deg, transparent 47%, #e8ded4 48%, #e8ded4 52%, transparent 53%)", backgroundSize: "170px 100px, 230px 130px, 100px 55px" }}><span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-court-red text-white shadow-lg"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span></div>
            </section>
          </div>
          <aside className="dashboard-card p-6">
            <p className="text-sm text-court-950/60">{startingPrice !== null ? "Mulai dari" : "Lapangan"}</p>
            <p className="mt-1 font-display text-3xl font-extrabold">{startingPrice !== null ? rupiah(startingPrice) : "Belum tersedia"}</p>
            {startingPrice !== null && <p className="mt-1 text-xs text-court-950/60">per jam · {courts.length} lapangan aktif</p>}
            <p className="mt-5 text-xs text-court-950/65">Jam buka {String(venue.open_time).slice(0, 5)}–{String(venue.close_time).slice(0, 5)} WIB</p>
            <a href="#booking" className="btn btn-dark mt-5 w-full">Cek ketersediaan</a>
          </aside>
        </div>
        {error && <p role="alert" className="profile-message error">{error}</p>}
        <section id="booking" className="mt-10 scroll-mt-28" aria-labelledby="courts-title">
          <h2 id="courts-title" className="font-display text-2xl font-extrabold">Pilih lapangan dan jadwal</h2>
          <p className="mt-2 text-sm text-court-950/60">Host dapat memilih beberapa jam berurutan dan menambahkan berbagai merek raket atau shuttlecock. Peserta mabar cukup bergabung ke aktivitas.</p>
          <VenueBookingFlow venueId={venue.id} courts={courts ?? []} rentals={rentals} shuttles={shuttles} busySlots={bookings ?? []} closures={closures ?? []} openWeekdays={venue.open_weekdays ?? [0,1,2,3,4,5,6]} openTime={venue.open_time} closeTime={venue.close_time} />
        </section>
        <section className="mt-12" aria-labelledby="catalog-title">
          <h2 id="catalog-title" className="font-display text-2xl font-extrabold">Katalog perlengkapan</h2>
          <p className="mt-2 text-sm text-court-950/60">Pilih perlengkapan dari katalog ini pada formulir booking lapangan di atas. Harga raket berlaku per sesi, sedangkan shuttlecock dijual per slop.</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(products ?? []).length === 0 && <p className="dashboard-card p-6 text-sm">Mitra ini belum menambahkan perlengkapan.</p>}
            {(products ?? []).map((product) => {
              const imageUrl = product.image_path ? supabase.storage.from("venue-products").getPublicUrl(product.image_path).data.publicUrl : sampleEquipmentImage(product.kind, product.name);
              return <article className="dashboard-card overflow-hidden" key={product.id}>
                <div className="relative h-44 bg-court-cream"><Image src={imageUrl} alt={product.name} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" unoptimized={imageUrl.startsWith("http")} />{!product.image_path && <span className="absolute bottom-2 left-2 rounded-lg bg-court-950/90 px-2 py-1 text-[10px] font-bold text-white">Ilustrasi produk</span>}</div>
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

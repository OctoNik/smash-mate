import Link from "next/link";
import Image from "next/image";
import AccountHeader from "@/components/account-header";
import VenueSearchForm from "@/components/venue-search-form";
import { requirePlayerAccount } from "@/lib/account";
import { rupiah } from "@/lib/format";
import { sampleVenueImage } from "@/lib/venue-images";

export const instant = false;

export default async function VenuesPage({ searchParams }) {
  const { supabase, user, name } = await requirePlayerAccount();
  const { q = "", max_price: requestedMaxPrice = "", gear: requestedGear = "" } = await searchParams;
  const search = typeof q === "string" ? q.trim().slice(0, 80).toLocaleLowerCase("id-ID") : "";
  const maxPrice = ["100000", "150000", "200000"].includes(requestedMaxPrice) ? Number(requestedMaxPrice) : 0;
  const gear = ["racket", "shuttle"].includes(requestedGear) ? requestedGear : "";
  const { data: venues, error } = await supabase.from("venues")
    .select("id,name,description,address,maps_url,courts(id,price_per_hour,is_active),venue_products(id,kind,is_active),venue_photos(image_path,created_at)")
    .eq("status", "active").order("created_at", { ascending: false }).limit(100);
  const visible = (venues ?? []).map((venue) => {
    const courts = (venue.courts ?? []).filter((court) => court.is_active);
    return {
      ...venue,
      courtCount: courts.length,
      minPrice: courts.length ? Math.min(...courts.map((court) => court.price_per_hour)) : 0,
      rackets: (venue.venue_products ?? []).some((product) => product.kind === "racket_rental" && product.is_active),
      shuttles: (venue.venue_products ?? []).some((product) => product.kind === "shuttlecock_sale" && product.is_active),
      photoUrl: venue.venue_photos?.length
        ? supabase.storage.from("venue-products").getPublicUrl([...venue.venue_photos].sort((a, b) => a.created_at.localeCompare(b.created_at))[0].image_path).data.publicUrl
        : sampleVenueImage(venue.id),
      isSample: !venue.venue_photos?.length,
    };
  }).filter((venue) =>
    (!search || `${venue.name} ${venue.address}`.toLocaleLowerCase("id-ID").includes(search)) &&
    (!maxPrice || (venue.courtCount > 0 && venue.minPrice <= maxPrice)) &&
    (!gear || (gear === "racket" ? venue.rackets : venue.shuttles)));
  return (
    <div className="dashboard-shell min-h-screen">
      <AccountHeader name={name} email={user.email ?? ""} user={user} active="venues" />
      <main className="shell py-10 sm:py-14">
        <p className="eyebrow">Mitra GOR SmashMate</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Cari lapangan badminton</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-court-950/65">Lihat lapangan, jadwal, harga, dan perlengkapan yang tersedia dalam satu tempat.</p>
        <VenueSearchForm search={search} maxPrice={maxPrice} gear={gear} />
        {(search || maxPrice || gear) && <Link href="/venues" className="mt-3 inline-block text-xs font-bold text-court-700 hover:underline">Hapus filter</Link>}
        {error && <p role="alert" className="profile-message error">Daftar GOR belum dapat dimuat.</p>}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {!error && visible.length === 0 && <div className="dashboard-card p-8 text-sm text-court-950/65">Belum ada GOR mitra yang cocok.</div>}
          {visible.map((venue) => {
            return <Link href={`/venues/${venue.id}`} className="dashboard-card group flex flex-col overflow-hidden hover:border-court-700" key={venue.id}>
              <div className="relative aspect-[4/3] overflow-hidden bg-court-cream"><Image src={venue.photoUrl} alt={`Lapangan ${venue.name}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" unoptimized={venue.photoUrl.startsWith("http")} />{venue.isSample && <span className="absolute bottom-3 left-3 rounded-lg bg-court-950/90 px-2 py-1 text-[11px] font-bold text-white">Ilustrasi sementara</span>}</div>
              <div className="flex flex-1 flex-col p-5"><span className="text-xs font-bold text-court-700">GOR badminton · {venue.courtCount} lapangan</span>
              <h2 className="mt-2 font-display text-xl font-extrabold">{venue.name}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-court-950/65">{venue.address}</p>
              <p className="mt-3 text-xs text-court-950/65">{[venue.rackets && "Sewa raket", venue.shuttles && "Shuttlecock"].filter(Boolean).join(" · ") || "Lapangan badminton"}</p>
              <div className="mt-auto flex items-end justify-between gap-3 border-t border-court-950/10 pt-4"><div><small className="text-court-950/60">{venue.courtCount ? "Mulai dari" : "Ketersediaan"}</small><p className="font-extrabold text-court-red">{venue.courtCount ? `${rupiah(venue.minPrice)} / jam` : "Belum ada lapangan aktif"}</p></div><span className="text-xs font-extrabold text-court-700">Lihat detail</span></div></div>
            </Link>;
          })}
        </div>
      </main>
    </div>
  );
}

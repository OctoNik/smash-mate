import Link from "next/link";
import AccountHeader from "@/components/account-header";
import { requirePlayerAccount } from "@/lib/account";
import { rupiah } from "@/lib/format";

export const instant = false;

export default async function VenuesPage({ searchParams }) {
  const { supabase, user, name } = await requirePlayerAccount();
  const { q = "", max_price: requestedMaxPrice = "", gear: requestedGear = "" } = await searchParams;
  const search = typeof q === "string" ? q.trim().slice(0, 80).toLocaleLowerCase("id-ID") : "";
  const maxPrice = ["100000", "150000", "200000"].includes(requestedMaxPrice) ? Number(requestedMaxPrice) : 0;
  const gear = ["racket", "shuttle"].includes(requestedGear) ? requestedGear : "";
  const { data: venues, error } = await supabase.from("venues")
    .select("id,name,description,address,maps_url,courts(id,price_per_hour,is_active),venue_products(id,kind,is_active)")
    .eq("status", "active").order("created_at", { ascending: false }).limit(100);
  const visible = (venues ?? []).map((venue) => {
    const courts = (venue.courts ?? []).filter((court) => court.is_active);
    return {
      ...venue,
      courtCount: courts.length,
      minPrice: courts.length ? Math.min(...courts.map((court) => court.price_per_hour)) : 0,
      rackets: (venue.venue_products ?? []).some((product) => product.kind === "racket_rental" && product.is_active),
      shuttles: (venue.venue_products ?? []).some((product) => product.kind === "shuttlecock_sale" && product.is_active),
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
        <form className="dashboard-card mt-7 grid gap-3 p-4 sm:grid-cols-[1fr_170px_170px_auto]" action="/venues">
          <input name="q" defaultValue={search} maxLength={80} className="profile-input" placeholder="Cari nama GOR atau kota" aria-label="Cari GOR atau kota" />
          <select name="max_price" defaultValue={String(maxPrice || "")} className="profile-input" aria-label="Harga maksimal per jam"><option value="">Semua harga</option><option value="100000">Maks. Rp100.000</option><option value="150000">Maks. Rp150.000</option><option value="200000">Maks. Rp200.000</option></select>
          <select name="gear" defaultValue={gear} className="profile-input" aria-label="Perlengkapan tersedia"><option value="">Semua perlengkapan</option><option value="racket">Ada sewa raket</option><option value="shuttle">Ada shuttlecock</option></select>
          <button className="btn btn-dark" type="submit">Terapkan</button>
        </form>
        {(search || maxPrice || gear) && <Link href="/venues" className="mt-3 inline-block text-xs font-bold text-court-700 hover:underline">Hapus filter</Link>}
        {error && <p role="alert" className="profile-message error">Daftar GOR belum dapat dimuat.</p>}
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {!error && visible.length === 0 && <div className="dashboard-card p-8 text-sm text-court-950/65">Belum ada GOR mitra yang cocok.</div>}
          {visible.map((venue) => {
            return <Link href={`/venues/${venue.id}`} className="dashboard-card flex flex-col p-6 hover:border-court-700" key={venue.id}>
              <span className="activity-tag w-fit">{venue.courtCount} lapangan</span>
              <h2 className="mt-4 text-xl font-extrabold">{venue.name}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-court-950/65">{venue.description || venue.address}</p>
              <p className="mt-4 text-xs font-bold text-court-700">{venue.address}</p>
              <p className="mt-3 text-xs text-court-950/65">{venue.rackets ? "Sewa raket tersedia" : "Tanpa rental raket"} · {venue.shuttles ? "Shuttlecock tersedia" : "Tanpa katalog shuttlecock"}</p>
              <div className="mt-auto flex items-end justify-between gap-3 pt-6"><div><small className="text-court-950/60">{venue.courtCount ? "Mulai dari" : "Ketersediaan"}</small><p className="font-extrabold">{venue.courtCount ? `${rupiah(venue.minPrice)} / jam` : "Belum ada lapangan aktif"}</p></div><span className="text-sm font-extrabold text-court-700">Lihat GOR</span></div>
            </Link>;
          })}
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";
import AccountHeader from "@/components/account-header";
import { requireAccount } from "@/lib/account";
import { rupiah } from "@/lib/format";

export const instant = false;

export default async function VenuesPage({ searchParams }) {
  const { supabase, user, name } = await requireAccount();
  const { q = "" } = await searchParams;
  const search = typeof q === "string" ? q.trim().slice(0, 80).toLocaleLowerCase("id-ID") : "";
  const { data: venues, error } = await supabase.from("venues")
    .select("id,name,description,address,maps_url,courts(id,price_per_hour,is_active),venue_products(id,kind,is_active)")
    .eq("status", "active").order("created_at", { ascending: false }).limit(100);
  const visible = (venues ?? []).filter((venue) =>
    !search || `${venue.name} ${venue.address}`.toLocaleLowerCase("id-ID").includes(search));
  return (
    <div className="dashboard-shell min-h-screen">
      <AccountHeader name={name} email={user.email ?? ""} user={user} active="venues" />
      <main className="shell py-10 sm:py-14">
        <p className="eyebrow">Mitra GOR SmashMate</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Cari lapangan badminton</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-court-950/65">Lihat lapangan, jadwal, harga, dan perlengkapan yang tersedia dalam satu tempat.</p>
        <form className="mt-7 flex max-w-xl gap-3" action="/venues">
          <input name="q" defaultValue={search} maxLength={80} className="profile-input flex-1" placeholder="Cari nama GOR atau kota" aria-label="Cari GOR" />
          <button className="btn btn-dark" type="submit">Cari</button>
        </form>
        {error && <p role="alert" className="profile-message error">Daftar GOR belum dapat dimuat.</p>}
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {!error && visible.length === 0 && <div className="dashboard-card p-8 text-sm text-court-950/65">Belum ada GOR mitra yang cocok.</div>}
          {visible.map((venue) => {
            const courts = (venue.courts ?? []).filter((court) => court.is_active);
            const minPrice = courts.length ? Math.min(...courts.map((court) => court.price_per_hour)) : 0;
            const rackets = (venue.venue_products ?? []).some((product) => product.kind === "racket_rental" && product.is_active);
            const shuttles = (venue.venue_products ?? []).some((product) => product.kind === "shuttlecock_sale" && product.is_active);
            return <article className="dashboard-card flex flex-col p-6" key={venue.id}>
              <span className="activity-tag w-fit">{courts.length} lapangan</span>
              <h2 className="mt-4 text-xl font-extrabold">{venue.name}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-court-950/65">{venue.description || venue.address}</p>
              <p className="mt-4 text-xs font-bold text-court-700">{venue.address}</p>
              <p className="mt-3 text-xs text-court-950/65">{rackets ? "Sewa raket tersedia" : "Tanpa rental raket"} · {shuttles ? "Shuttlecock tersedia" : "Tanpa katalog shuttlecock"}</p>
              <div className="mt-auto flex items-end justify-between gap-3 pt-6"><div><small className="text-court-950/60">{courts.length ? "Mulai dari" : "Ketersediaan"}</small><p className="font-extrabold">{courts.length ? `${rupiah(minPrice)} / jam` : "Belum ada lapangan aktif"}</p></div><Link href={`/venues/${venue.id}`} className="btn btn-dark">Lihat GOR</Link></div>
            </article>;
          })}
        </div>
      </main>
    </div>
  );
}

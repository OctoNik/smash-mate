import { redirect } from "next/navigation";
import AccountHeader from "@/components/account-header";
import PartnerProvisionForm, { InitialProvisionForm } from "@/components/partner-provision-form";
import { requireAccount } from "@/lib/account";

export const instant = false;
const initialVenueNames = new Set([
  "GOR Kencana Grogol", "Karawaci Badminton Center", "Senayan Shuttle Arena",
  "Bekasi Racket Hall", "Depok Smash Court",
]);

export default async function OperatorPage({ searchParams }) {
  const { supabase, user, name } = await requireAccount();
  if (user.app_metadata?.smashmate_role !== "operator") redirect("/dashboard");
  const { error, message } = await searchParams;
  const { data: venues, error: listError } = await supabase.from("venues")
    .select("id,name,address,status,owner_id,created_at,courts(id)")
    .order("created_at", { ascending: false }).limit(100);
  const initialVenues = (venues ?? []).filter((venue) => initialVenueNames.has(venue.name));
  const initialReady = initialVenues.length === 5 && initialVenues.every((venue) => venue.owner_id === user.id);
  return <div className="dashboard-shell min-h-screen">
    <AccountHeader name={name} email={user.email ?? ""} user={user} active="operator" />
    <main className="shell max-w-6xl py-10 sm:py-14">
      <p className="eyebrow">Internal SmashMate</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Operator GOR</h1>
      <p className="mt-3 text-sm leading-7 text-court-950/65">Operator membuat akun saat bertemu Mitra GOR, lalu memberikan kredensial awal secara langsung. Mitra mengganti kata sandi dan mengisi data GOR sendiri.</p>
      {error && <p role="alert" className="profile-message error">{error}</p>}
      {message && <p role="status" className="profile-message success">{message}</p>}
      <div className="mt-9 grid items-start gap-7 lg:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-5"><section className="dashboard-card p-6 sm:p-8" aria-labelledby="create-partner-title">
          <h2 id="create-partner-title" className="text-xl font-extrabold">Buat akun Mitra GOR</h2>
          <p className="mt-2 text-sm text-court-950/60">Gunakan email Mitra yang belum terdaftar. Tidak ada email undangan yang dikirim.</p>
          <PartnerProvisionForm />
        </section>
          {initialVenues.length === 5 && <section className="dashboard-card p-6 sm:p-8" aria-labelledby="initial-partner-title">
            <h2 id="initial-partner-title" className="text-xl font-extrabold">Akun untuk 5 GOR awal</h2>
            <p className="mt-2 text-sm leading-6 text-court-950/60">Kelima GOR dan katalognya sudah tersedia. Buat akun Mitra dan pasangkan otomatis. Kata sandi awal hanya tampil sekali.</p>
            <InitialProvisionForm ready={initialReady} />
          </section>}
        </div>
        <section aria-labelledby="venue-list-title">
          <h2 id="venue-list-title" className="text-xl font-extrabold">GOR terdaftar</h2>
          {listError && <p role="alert" className="profile-message error">Daftar GOR belum dapat dimuat.</p>}
          <div className="mt-5 space-y-3">
            {(venues ?? []).length === 0 && <p className="dashboard-card p-5 text-sm">Belum ada Mitra GOR.</p>}
            {(venues ?? []).map((venue) => <article key={venue.id} className="dashboard-card flex flex-wrap items-center justify-between gap-3 p-5">
              <div><h3 className="font-extrabold">{venue.name}</h3><p className="mt-1 text-xs text-court-950/60">{venue.address || "Menunggu Mitra mengisi alamat"} · {venue.courts?.length ?? 0} lapangan</p></div>
              <span className="activity-tag">{venue.status === "active" ? "Aktif" : "Menunggu data"}</span>
            </article>)}
          </div>
        </section>
      </div>
    </main>
  </div>;
}

import { redirect } from "next/navigation";
import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { requireAccount } from "@/lib/account";
import { invitePartner } from "./actions";

export const instant = false;

export default async function OperatorPage({ searchParams }) {
  const { supabase, user, name } = await requireAccount();
  if (user.app_metadata?.smashmate_role !== "operator") redirect("/dashboard");
  const { error, message } = await searchParams;
  const { data: venues, error: listError } = await supabase.from("venues")
    .select("id,name,address,status,created_at,courts(id)")
    .order("created_at", { ascending: false }).limit(100);
  return <div className="dashboard-shell min-h-screen">
    <AccountHeader name={name} email={user.email ?? ""} user={user} active="operator" />
    <main className="shell max-w-6xl py-10 sm:py-14">
      <p className="eyebrow">Internal SmashMate</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Operator GOR</h1>
      <p className="mt-3 text-sm leading-7 text-court-950/65">Hanya operator yang dapat membuat akun Mitra GOR. Mitra menerima undangan email, lalu melengkapi profil dan lapangannya.</p>
      {error && <p role="alert" className="profile-message error">{error}</p>}
      {message && <p role="status" className="profile-message success">{message}</p>}
      <div className="mt-9 grid items-start gap-7 lg:grid-cols-[.8fr_1.2fr]">
        <section className="dashboard-card p-6 sm:p-8" aria-labelledby="invite-title">
          <h2 id="invite-title" className="text-xl font-extrabold">Undang Mitra GOR</h2>
          <p className="mt-2 text-sm text-court-950/60">Gunakan email baru yang belum punya akun SmashMate.</p>
          <form action={invitePartner} className="mt-5 space-y-4">
            <label className="profile-label">Email admin GOR<input name="email" type="email" required autoComplete="off" className="profile-input" /></label>
            <label className="profile-label">Nama GOR<input name="venue_name" required minLength={3} maxLength={100} className="profile-input" /></label>
            <SubmitButton className="btn btn-dark w-full" pendingText="Mengirim undangan...">Kirim undangan</SubmitButton>
          </form>
        </section>
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

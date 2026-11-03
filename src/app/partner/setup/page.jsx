import { redirect } from "next/navigation";
import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { requireAccount } from "@/lib/account";
import { publishVenue } from "../actions";

export const instant = false;

export default async function PartnerSetupPage({ searchParams }) {
  const { supabase, user, name } = await requireAccount();
  const { error } = await searchParams;
  const { data: venue } = await supabase.from("venues").select("id,name,status")
    .eq("owner_id", user.id).order("created_at").limit(1).maybeSingle();
  if (!venue) redirect("/partner");
  if (venue.status === "active") redirect("/partner");
  return <div className="dashboard-shell min-h-screen">
    <AccountHeader name={name} email={user.email ?? ""} user={user} active="partner" />
    <main className="shell max-w-3xl py-10 sm:py-14">
      <p className="eyebrow">Mitra GOR terverifikasi</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Lengkapi GOR Anda</h1>
      <p className="mt-3 text-sm leading-7 text-court-950/65">Akun mitra telah dibuat oleh operator SmashMate. Isi data GOR dan jumlah lapangan agar pemain dapat menemukannya.</p>
      {error && <p role="alert" className="profile-message error">{error}</p>}
      <form action={publishVenue} className="dashboard-card mt-8 space-y-5 p-6 sm:p-8">
        <input type="hidden" name="venue_id" value={venue.id} />
        <label className="profile-label">Nama GOR<input name="name" defaultValue={venue.name} required minLength={3} maxLength={100} className="profile-input" /></label>
        <label className="profile-label">Deskripsi<textarea name="description" maxLength={2000} rows={4} className="profile-input" placeholder="Ceritakan fasilitas dan keunggulan GOR" /></label>
        <label className="profile-label">Alamat lengkap<input name="address" required minLength={10} maxLength={250} className="profile-input" /></label>
        <label className="profile-label">Tautan Google Maps<input name="maps_url" type="url" required className="profile-input" placeholder="https://maps.app.goo.gl/..." /></label>
        <label className="profile-label">Nomor kontak<input name="contact_phone" maxLength={30} className="profile-input" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="profile-label">Buka (WIB)<input name="open_time" type="time" defaultValue="07:00" required className="profile-input" /></label>
          <label className="profile-label">Tutup (WIB)<input name="close_time" type="time" defaultValue="22:00" required className="profile-input" /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="profile-label">Jumlah lapangan<input name="court_count" type="number" min="1" max="30" defaultValue="2" required className="profile-input" /></label>
          <label className="profile-label">Harga awal per lapangan / jam (Rp)<input name="court_price" type="number" min="0" max="10000000" defaultValue="70000" required className="profile-input" /></label>
        </div>
        <p className="text-xs leading-6 text-court-950/60">Sistem akan membuat Lapangan 1, 2, dan seterusnya. Harga tiap lapangan bisa diubah setelah GOR diterbitkan.</p>
        <SubmitButton className="btn btn-dark w-full" pendingText="Menerbitkan GOR...">Terbitkan GOR</SubmitButton>
      </form>
    </main>
  </div>;
}

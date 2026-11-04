import Link from "next/link";
import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { requirePlayerAccount } from "@/lib/account";
import { saveCoachProfile } from "./actions";

export const instant = false;

export default async function CoachesPage({ searchParams }) {
  const { supabase, user, name } = await requirePlayerAccount();
  const { error, message } = await searchParams;
  const [{ data: coaches }, { data: mine }] = await Promise.all([
    supabase.from("coach_profiles").select("user_id,display_name,bio,city")
      .eq("is_active", true).order("created_at", { ascending: false }).limit(50),
    supabase.from("coach_profiles").select("bio,city,is_active").eq("user_id", user.id).maybeSingle(),
  ]);
  return <div className="dashboard-shell min-h-screen">
    <AccountHeader name={name} email={user.email ?? ""} user={user} active="coaches" />
    <main className="shell py-10 sm:py-14">
      <p className="eyebrow">Latihan badminton</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Cari coach</h1>
      <p className="mt-3 text-sm text-court-950/65">Coach adalah fitur tambahan pada akun pemain. Profil coach dibuat sendiri oleh pemain dan belum melalui verifikasi sertifikasi.</p>
      {error && <p role="alert" className="profile-message error">{error}</p>}
      {message && <p role="status" className="profile-message success">{message}</p>}
      <div className="mt-9 grid items-start gap-7 lg:grid-cols-[.8fr_1.2fr]">
        <section className="dashboard-card p-6 sm:p-8"><h2 className="text-xl font-extrabold">{mine ? "Profil coach saya" : "Jadi coach"}</h2>
          <p className="mt-2 text-sm leading-6 text-court-950/60">Setelah aktif, Anda dapat membuat sesi latihan dari halaman Aktivitas.</p>
          <form action={saveCoachProfile} className="mt-5 space-y-4">
            <label className="profile-label">Kota<input name="city" defaultValue={mine?.city ?? ""} maxLength={80} className="profile-input" /></label>
            <label className="profile-label">Pengalaman dan fokus latihan<textarea name="bio" defaultValue={mine?.bio ?? ""} maxLength={600} rows={5} className="profile-input" /></label>
            <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={mine?.is_active ?? true} /> Tampilkan profil coach</label>
            <SubmitButton className="btn btn-dark" pendingText="Menyimpan...">Simpan profil coach</SubmitButton>
          </form>
        </section>
        <section><h2 className="text-xl font-extrabold">Coach yang tersedia</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
          {(coaches ?? []).length === 0 && <p className="dashboard-card p-6 text-sm">Belum ada coach aktif.</p>}
          {(coaches ?? []).map((coach) => <article className="dashboard-card p-6" key={coach.user_id}><span className="activity-tag">Coach</span><h3 className="mt-3 text-lg font-extrabold">{coach.display_name}</h3><p className="mt-1 text-xs text-court-950/60">{coach.city || "Lokasi belum diisi"}</p><p className="mt-3 text-sm leading-6 text-court-950/70">{coach.bio || "Belum ada deskripsi."}</p></article>)}
        </div><Link href="/activities" className="btn btn-outline-dark mt-5">Lihat sesi latihan</Link></section>
      </div>
    </main>
  </div>;
}

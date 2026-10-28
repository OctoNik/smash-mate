import Link from "@/components/loading-link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { deleteAccount } from "./actions";

export const instant = false;

export default async function SettingsPage({ searchParams }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=Silakan masuk untuk membuka pengaturan.");

  const fullName = typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
    ? user.user_metadata.full_name.trim()
    : user.email?.split("@")[0] ?? "Pemain";
  const { error } = await searchParams;

  return (
    <div className="dashboard-shell min-h-screen">
      <AccountHeader name={fullName} email={user.email ?? ""} user={user} active="settings" />
      <main className="shell max-w-5xl py-10 sm:py-14">
        <p className="eyebrow">Akun pemain</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Pengaturan akun</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-court-950/65">Kelola informasi dasar akun SmashMate Anda.</p>
        {error && <p role="alert" className="profile-message error">{error}</p>}
        <div className="mt-9 grid gap-5 md:grid-cols-2">
          <section className="dashboard-card p-6 sm:p-8">
            <h2 className="text-xl font-extrabold">Informasi akun</h2>
            <p className="mt-4 text-sm text-court-950/65">Email terdaftar: <strong className="break-all text-court-950">{user.email}</strong></p>
            <Link href="/profile" className="mt-6 inline-flex text-sm font-extrabold text-court-red hover:underline">Ubah nama dan level</Link>
          </section>
          <section className="dashboard-card p-6 sm:p-8">
            <h2 className="text-xl font-extrabold">Hapus akun</h2>
            <p className="mt-4 text-sm leading-7 text-court-950/65">Tindakan ini permanen. Aktivitas, permintaan perlengkapan, dan feedback milik akun akan ikut dihapus.</p>
              <form action={deleteAccount} className="mt-5 space-y-4">
                <label className="profile-label">Ketik HAPUS untuk konfirmasi
                  <input name="confirmation" type="text" required autoComplete="off" className="profile-input" />
                </label>
                <label className="profile-label">Kata sandi akun
                  <input name="password" type="password" required autoComplete="current-password" className="profile-input" />
                </label>
                <SubmitButton className="btn account-delete-button" pendingText="Menghapus akun..." confirmMessage="Hapus akun SmashMate Anda secara permanen?">Hapus akun saya</SubmitButton>
              </form>
          </section>
        </div>
      </main>
    </div>
  );
}

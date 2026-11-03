import { redirect } from "next/navigation";
import BrandLogo from "@/components/brand-logo";
import SubmitButton from "@/components/submit-button";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { setPartnerPassword } from "./actions";

export const instant = false;

export default async function PartnerPasswordPage({ searchParams }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=Silakan masuk sebagai Mitra GOR.");
  if (user.app_metadata?.smashmate_role !== "partner") redirect("/dashboard");
  if (user.app_metadata?.password_setup_required !== true) redirect("/partner");
  const { error } = await searchParams;
  return <div className="dashboard-shell min-h-screen">
    <header className="shell py-6"><BrandLogo href="/" /></header>
    <main className="shell flex flex-1 items-center justify-center py-12">
      <section className="dashboard-card w-full max-w-lg p-7 sm:p-9">
        <p className="eyebrow">Akun Mitra GOR</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">Buat kata sandi pribadi</h1>
        <p className="mt-3 text-sm leading-6 text-court-950/65">Anda masuk dengan kata sandi awal dari operator. Ganti sekarang sebelum melengkapi profil GOR.</p>
        {error && <p role="alert" className="profile-message error">{error}</p>}
        <form action={setPartnerPassword} className="mt-6 space-y-4">
          <label className="profile-label">Kata sandi baru<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className="profile-input" /></label>
          <label className="profile-label">Ulangi kata sandi baru<input name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className="profile-input" /></label>
          <SubmitButton className="btn btn-dark w-full" pendingText="Menyimpan...">Simpan dan lanjutkan</SubmitButton>
        </form>
        <form action={logout} className="mt-6"><button className="text-sm font-bold text-court-700 hover:underline" type="submit">Keluar dari akun</button></form>
      </section>
    </main>
  </div>;
}

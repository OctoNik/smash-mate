import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/account";
import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { deleteAccount } from "./actions";

export const instant = false;

export default async function SettingsPage({ searchParams }) {
  const { user } = await requireAccount();
  if (!["partner", "operator"].includes(user.app_metadata?.smashmate_role)) redirect("/profile#delete-account");

  const name = typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
    ? user.user_metadata.full_name.trim() : user.email?.split("@")[0] ?? "Akun";
  const { account_error: accountError } = await searchParams;

  return <div className="dashboard-shell min-h-screen">
    <AccountHeader name={name} email={user.email ?? ""} user={user} active="settings" />
    <main className="shell max-w-3xl py-10 sm:py-14">
      <p className="eyebrow">Akun SmashMate</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Pengaturan akun</h1>
      <p className="mt-3 text-sm leading-7 text-court-950/65">{user.app_metadata.smashmate_role === "partner" ? "Pengelolaan profil dan katalog GOR tersedia di panel Mitra." : "Pengelolaan Mitra GOR tersedia di panel operator."}</p>
      <section className="dashboard-card mt-8 p-6 sm:p-8" aria-labelledby="account-info-title">
        <h2 id="account-info-title" className="text-xl font-extrabold">Informasi akun</h2>
        <p className="mt-3 break-all text-sm text-court-950/70">Email terdaftar: <strong className="text-court-950">{user.email}</strong></p>
      </section>
      <section className="dashboard-card mt-5 p-6 sm:p-8" aria-labelledby="delete-account-title">
        <h2 id="delete-account-title" className="text-xl font-extrabold">Hapus akun</h2>
        <p className="mt-3 text-sm leading-7 text-court-950/65">Tindakan ini permanen. Data yang terkait dengan akun dapat ikut terhapus.</p>
        {accountError && <p role="alert" className="profile-message error">{accountError}</p>}
        <form action={deleteAccount} className="mt-5 space-y-4">
          <label className="profile-label">Ketik HAPUS untuk konfirmasi<input name="confirmation" type="text" required autoComplete="off" className="profile-input" /></label>
          <label className="profile-label">Kata sandi akun<input name="password" type="password" required autoComplete="current-password" className="profile-input" /></label>
          <SubmitButton className="btn account-delete-button" pendingText="Menghapus akun..." confirmMessage="Hapus akun SmashMate Anda secara permanen?">Hapus akun saya</SubmitButton>
        </form>
      </section>
    </main>
  </div>;
}

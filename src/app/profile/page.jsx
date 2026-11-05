import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/account";
import Link from "@/components/loading-link";
import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import ProfileRatings from "@/components/profile-ratings";
import { getAvatarUrl } from "@/lib/avatar";
import { deleteAccount } from "@/app/settings/actions";
import { updateProfile, uploadAvatar } from "./actions";

export const instant = false;

export default async function ProfilePage({ searchParams }) {
  const { supabase, user } = await requireAccount();
  if (["partner", "operator"].includes(user.app_metadata?.smashmate_role)) redirect("/settings");

  const { message, error, account_error: accountError, rating_page: ratingPage } = await searchParams;
  const fullName = typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
    ? user.user_metadata.full_name.trim()
    : user.email?.split("@")[0] ?? "Pemain";
  const level = ["beginner", "intermediate", "professional"].includes(user.user_metadata?.level)
    ? user.user_metadata.level : "beginner";
  const avatarUrl = await getAvatarUrl(supabase, user);

  return (
    <div className="dashboard-shell min-h-screen">
      <AccountHeader name={fullName} email={user.email ?? ""} user={user} active="profile" />
      <main className="shell max-w-5xl py-10 sm:py-14">
        <p className="eyebrow">Akun SmashMate</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Profil & pengaturan</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-court-950/65">Kelola nama, level bermain, foto profil, dan akun Anda di satu tempat.</p>
        {message && <p role="status" className="profile-message success">{message}</p>}
        {error && <p role="alert" className="profile-message error">{error}</p>}

        <div className="mt-9 grid gap-5 lg:grid-cols-[.72fr_1.28fr]">
          <aside className="dashboard-card p-6">
            <div className="profile-avatar" aria-label={avatarUrl ? `Foto profil ${fullName}` : `Inisial ${fullName}`} style={avatarUrl ? { backgroundImage: `url('${avatarUrl}')`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{avatarUrl ? "" : fullName.charAt(0).toUpperCase()}</div>
            <h2 className="mt-5 text-xl font-extrabold">{fullName}</h2>
            <p className="mt-1 break-all text-sm text-court-950/60">{user.email}</p>
            <span className="activity-tag mt-4">{level === "professional" ? "Professional" : level === "intermediate" ? "Intermediate" : "Beginner"}</span>
            <form action={uploadAvatar} className="mt-6 space-y-3 border-t border-court-950/10 pt-6">
              <label className="profile-label">Foto profil
                <input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required className="profile-input file:mr-3 file:rounded-md file:border-0 file:bg-court-cream file:px-3 file:py-1 file:text-court-950" />
              </label>
              <p className="text-xs leading-5 text-court-950/60">JPG, PNG, atau WebP. Maksimal 2 MB.</p>
              <SubmitButton pendingText="Mengunggah foto..." className="btn btn-outline-dark w-full">Unggah foto</SubmitButton>
            </form>
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-court-950/10 pt-5 text-xs font-bold text-court-700"><Link href="/activities?view=mine" className="hover:underline">Aktivitas saya</Link><Link href="/bookings" className="hover:underline">Booking saya</Link><a href="#my-ratings" className="hover:underline">Rating saya</a><a href="#delete-account" className="hover:underline">Pengaturan akun</a></div>
          </aside>

          <section className="dashboard-card p-6 sm:p-8" aria-labelledby="edit-profile-title">
            <h2 id="edit-profile-title" className="text-xl font-extrabold">Edit profil</h2>
            <p className="mt-2 text-sm text-court-950/60">Perubahan nama dan level tersimpan pada akun Anda.</p>
            <form action={updateProfile} className="mt-7 space-y-5">
              <label className="profile-label">Nama pengguna
                <input name="full_name" type="text" required minLength={2} maxLength={60} defaultValue={fullName} className="profile-input" autoComplete="name" />
              </label>
              <label className="profile-label">Level bermain
                <select name="level" defaultValue={level} className="profile-input">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="professional">Professional</option>
                </select>
              </label>
              <SubmitButton pendingText="Menyimpan profil..." className="btn btn-dark">Simpan perubahan</SubmitButton>
            </form>
          </section>
        </div>
        <ProfileRatings supabase={supabase} userId={user.id} requestedPage={ratingPage} />
        <section id="delete-account" className="dashboard-card mt-5 scroll-mt-28 p-6 sm:p-8" aria-labelledby="delete-account-title">
          <h2 id="delete-account-title" className="text-xl font-extrabold">Hapus akun</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-court-950/65">Tindakan ini permanen. Aktivitas dan permintaan perlengkapan milik akun akan ikut dihapus.</p>
          {accountError && <p role="alert" className="profile-message error">{accountError}</p>}
          <form action={deleteAccount} className="mt-5 max-w-xl space-y-4">
            <label className="profile-label">Ketik HAPUS untuk konfirmasi
              <input name="confirmation" type="text" required autoComplete="off" className="profile-input" />
            </label>
            <label className="profile-label">Kata sandi akun
              <input name="password" type="password" required autoComplete="current-password" className="profile-input" />
            </label>
            <SubmitButton className="btn account-delete-button" pendingText="Menghapus akun..." confirmMessage="Hapus akun SmashMate Anda secara permanen?">Hapus akun saya</SubmitButton>
          </form>
        </section>
      </main>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { getAvatarUrl } from "@/lib/avatar";
import { updateProfile, uploadAvatar } from "./actions";

export const instant = false;

export default async function ProfilePage({ searchParams }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=Silakan masuk untuk membuka profil.");

  const { message, error } = await searchParams;
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
        <p className="eyebrow">Akun pemain</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Profil saya</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-court-950/65">Atur nama, level bermain, dan foto profil untuk aktivitas badminton Anda.</p>

        <div className="mt-9 grid gap-5 lg:grid-cols-[.72fr_1.28fr]">
          <aside className="dashboard-card p-6">
            <div className="profile-avatar" aria-label={avatarUrl ? `Foto profil ${fullName}` : `Inisial ${fullName}`} style={avatarUrl ? { backgroundImage: `url('${avatarUrl}')`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{avatarUrl ? "" : fullName.charAt(0).toUpperCase()}</div>
            <h2 className="mt-5 text-xl font-extrabold">{fullName}</h2>
            <p className="mt-1 break-all text-sm text-court-950/60">{user.email}</p>
            <form action={uploadAvatar} className="mt-6 space-y-3 border-t border-court-950/10 pt-6">
              <label className="profile-label">Foto profil
                <input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required className="profile-input file:mr-3 file:rounded-md file:border-0 file:bg-court-cream file:px-3 file:py-1 file:text-court-950" />
              </label>
              <p className="text-xs leading-5 text-court-950/60">JPG, PNG, atau WebP. Maksimal 2 MB.</p>
              <SubmitButton pendingText="Mengunggah foto..." className="btn btn-outline-dark w-full">Unggah foto</SubmitButton>
            </form>
          </aside>

          <section className="dashboard-card p-6 sm:p-8" aria-labelledby="edit-profile-title">
            <h2 id="edit-profile-title" className="text-xl font-extrabold">Edit profil</h2>
            <p className="mt-2 text-sm text-court-950/60">Perubahan nama dan level tersimpan pada akun Anda.</p>
            {message && <p role="status" className="profile-message success">{message}</p>}
            {error && <p role="alert" className="profile-message error">{error}</p>}
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
              <label className="profile-label">Email
                <input type="email" value={user.email ?? ""} readOnly className="profile-input read-only" />
              </label>
              <SubmitButton pendingText="Menyimpan profil..." className="btn btn-dark">Simpan perubahan</SubmitButton>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

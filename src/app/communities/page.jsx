import Link from "next/link";
import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { requireAccount } from "@/lib/account";
import { createCommunity, joinCommunity, leaveCommunity } from "./actions";

export const instant = false;

export default async function CommunitiesPage({ searchParams }) {
  const { supabase, user, name } = await requireAccount();
  const { error, message } = await searchParams;
  const { data: communities, error: listError } = await supabase.from("communities")
    .select("id,owner_id,name,description,city,community_members(user_id)")
    .order("created_at", { ascending: false }).limit(50);
  return <div className="dashboard-shell min-h-screen">
    <AccountHeader name={name} email={user.email ?? ""} user={user} active="communities" />
    <main className="shell py-10 sm:py-14">
      <p className="eyebrow">Komunitas badminton</p><h1 className="font-display text-3xl font-extrabold sm:text-4xl">Main bersama komunitas</h1>
      <p className="mt-3 text-sm text-court-950/65">Setiap pemain dapat membuat komunitas, bergabung, dan mengadakan event. Pendiri dapat mengaitkan komunitas saat membuat aktivitas.</p>
      {error && <p role="alert" className="profile-message error">{error}</p>}{message && <p role="status" className="profile-message success">{message}</p>}
      <div className="mt-9 grid items-start gap-7 lg:grid-cols-[.8fr_1.2fr]">
        <section className="dashboard-card p-6 sm:p-8"><h2 className="text-xl font-extrabold">Buat komunitas</h2><form action={createCommunity} className="mt-5 space-y-4">
          <label className="profile-label">Nama komunitas<input name="name" required minLength={3} maxLength={80} className="profile-input" /></label>
          <label className="profile-label">Kota<input name="city" maxLength={80} className="profile-input" /></label>
          <label className="profile-label">Deskripsi<textarea name="description" maxLength={800} rows={4} className="profile-input" /></label>
          <SubmitButton className="btn btn-dark" pendingText="Membuat...">Buat komunitas</SubmitButton>
        </form></section>
        <section><h2 className="text-xl font-extrabold">Jelajahi komunitas</h2>{listError && <p role="alert" className="profile-message error">Daftar komunitas belum dapat dimuat.</p>}
          <div className="mt-5 space-y-4">{(communities ?? []).length === 0 && <p className="dashboard-card p-6 text-sm">Belum ada komunitas.</p>}
            {(communities ?? []).map((community) => {
              const joined = community.community_members?.some((member) => member.user_id === user.id);
              const owner = community.owner_id === user.id;
              return <article className="dashboard-card p-6" key={community.id}><div className="flex flex-wrap justify-between gap-3"><h3 className="text-lg font-extrabold">{community.name}</h3><span className="activity-tag">{community.city || "Online"}</span></div>
                <p className="mt-2 text-sm leading-6 text-court-950/65">{community.description || "Belum ada deskripsi."}</p><p className="mt-3 text-xs text-court-950/60">{community.community_members?.length ?? 0} anggota</p>
                <div className="mt-4">{owner ? <Link href="/activities?view=create#new" className="btn btn-outline-dark">Buat event</Link> : joined ? <form action={leaveCommunity}><input type="hidden" name="id" value={community.id} /><SubmitButton className="btn btn-outline-dark" pendingText="Keluar...">Keluar komunitas</SubmitButton></form> : <form action={joinCommunity}><input type="hidden" name="id" value={community.id} /><SubmitButton className="btn btn-dark" pendingText="Bergabung...">Gabung komunitas</SubmitButton></form>}</div>
              </article>;
            })}
          </div>
        </section>
      </div>
    </main>
  </div>;
}

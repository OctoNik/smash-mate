import Link from "@/components/loading-link";
import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { requirePlayerAccount } from "@/lib/account";
import { createCommunity } from "./actions";

export const instant = false;

export default async function CommunitiesPage({ searchParams }) {
  const { supabase, user, name } = await requirePlayerAccount();
  const params = await searchParams;
  const query = String(params.q ?? "").trim().slice(0, 80);
  const city = String(params.city ?? "").trim().slice(0, 80);
  let request = supabase.from("communities")
    .select("id,name,description,city,community_members(user_id),community_photos(image_path,created_at)")
    .order("created_at", { ascending: false }).limit(60);
  if (query) request = request.ilike("name", `%${query.replace(/[%_]/g, "\\$&")}%`);
  if (city) request = request.ilike("city", `%${city.replace(/[%_]/g, "\\$&")}%`);
  const { data: communities, error } = await request;
  return <div className="dashboard-shell min-h-screen"><AccountHeader name={name} email={user.email ?? ""} user={user} active="communities" />
    <main className="shell py-10 sm:py-14"><p className="eyebrow">Komunitas badminton</p><h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Temukan teman main yang rutin</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-court-950/65">Lihat anggota, kegiatan, dan kompetisi komunitas sebelum bergabung. Pendiri dapat mengadakan aktivitas atas nama komunitas.</p>
      {params.error && <p role="alert" className="profile-message error">{params.error}</p>}
      <form className="dashboard-card mt-8 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]" action="/communities"><label className="profile-label">Cari komunitas<input name="q" defaultValue={query} maxLength={80} placeholder="Nama komunitas" className="profile-input" /></label><label className="profile-label">Kota<input name="city" defaultValue={city} maxLength={80} placeholder="Contoh: Jakarta" className="profile-input" /></label><button className="btn btn-dark self-end" type="submit">Cari</button></form>
      <div className="mt-8 flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold">Jelajahi komunitas</h2><span className="text-sm text-court-950/60">{communities?.length ?? 0} komunitas</span></div>
      {error && <p role="alert" className="profile-message error">Daftar komunitas belum dapat dimuat.</p>}
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{!error && !communities?.length && <p className="dashboard-card p-6 text-sm">Belum ada komunitas yang cocok.</p>}
        {(communities ?? []).map((community) => { const photo = [...(community.community_photos ?? [])].sort((a,b) => a.created_at.localeCompare(b.created_at))[0]; const url = photo ? supabase.storage.from("community-media").getPublicUrl(photo.image_path).data.publicUrl : null;
          return <Link key={community.id} href={`/communities/${community.id}`} className="dashboard-card overflow-hidden hover:border-court-700"><div className="flex h-36 items-center justify-center bg-court-800 bg-cover bg-center" style={url ? { backgroundImage: `url('${url}')` } : undefined}><span className="grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-court-cream text-2xl font-black text-court-red">{community.name.charAt(0)}</span></div><div className="p-5"><h3 className="text-lg font-extrabold">{community.name}</h3><p className="mt-1 text-sm text-court-950/60">{community.city || "Lokasi belum diisi"} · {community.community_members?.length ?? 0} anggota</p><p className="mt-3 line-clamp-2 text-sm leading-6 text-court-950/70">{community.description || "Belum ada deskripsi."}</p><span className="mt-4 block text-sm font-extrabold text-court-red">Lihat komunitas</span></div></Link>; })}
      </div>
      <section className="dashboard-card mt-12 max-w-2xl p-6 sm:p-8"><h2 className="text-xl font-extrabold">Buat komunitas sendiri</h2><p className="mt-2 text-sm text-court-950/60">Atur profil, anggota, galeri, dan kegiatan komunitas Anda.</p><form action={createCommunity} className="mt-5 space-y-4"><label className="profile-label">Nama komunitas<input name="name" required minLength={3} maxLength={80} className="profile-input" /></label><label className="profile-label">Kota<input name="city" maxLength={80} className="profile-input" /></label><label className="profile-label">Tentang komunitas<textarea name="description" maxLength={800} rows={4} className="profile-input" /></label><SubmitButton className="btn btn-dark" pendingText="Membuat...">Buat komunitas</SubmitButton></form></section>
    </main></div>;
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const quickActions = [
  { icon: "⌕", title: "Cari mabar", description: "Temukan pertandingan berdasarkan lokasi, jadwal, dan level." },
  { icon: "+", title: "Buat match", description: "Buka pertandingan baru dan tentukan kebutuhan pemain." },
  { icon: "◎", title: "Cari coach", description: "Temukan sesi latihan yang sesuai dengan target bermain." },
  { icon: "◇", title: "Host event", description: "Siapkan event badminton untuk pemain atau komunitas." },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Silakan masuk untuk membuka dashboard.");
  }

  const fullName = typeof user.user_metadata.full_name === "string"
    ? user.user_metadata.full_name
    : user.email?.split("@")[0] ?? "Pemain";
  const firstName = fullName.split(" ")[0];

  return (
    <div className="min-h-screen bg-ivory text-navy-950">
      <header className="sticky top-0 z-40 border-b border-navy-950/10 bg-ivory/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-navy-950 font-display font-black text-lime">SM</span>
            <span className="font-display text-xl font-black">SmashMate<span className="text-burgundy">.</span></span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-bold text-slate-600 md:flex">
            <Link href="/dashboard" className="text-navy-950">Dashboard</Link>
            <span className="cursor-not-allowed opacity-45">Cari Mabar</span>
            <span className="cursor-not-allowed opacity-45">Aktivitas</span>
            <span className="cursor-not-allowed opacity-45">Komunitas</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-sm font-extrabold">{fullName}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Player</p></div>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-burgundy font-display font-black text-white">{firstName.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10">
        <section className="grid gap-6 lg:grid-cols-[1.7fr_0.8fr]">
          <div className="relative overflow-hidden bg-navy-950 p-7 text-white sm:p-10">
            <div className="court-grid pointer-events-none absolute inset-0 opacity-70" />
            <div className="relative z-10 max-w-2xl">
              <p className="eyebrow">Dashboard Player</p>
              <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">Halo, {firstName}. Siap turun ke lapangan?</h1>
              <p className="mt-5 max-w-xl leading-7 text-slate-400">Lengkapi profil bermain agar SmashMate nantinya dapat memberikan rekomendasi partner dan aktivitas yang lebih sesuai.</p>
              <div className="mt-8 flex flex-wrap gap-3"><span className="bg-lime px-5 py-3 text-sm font-extrabold text-navy-950">Lengkapi profil →</span><Link href="/" className="border border-white/15 px-5 py-3 text-sm font-bold">Lihat landing page</Link></div>
            </div>
          </div>

          <aside className="border border-navy-950/10 bg-white p-6">
            <div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[.14em] text-burgundy">Status profil</p><span className="text-xs font-bold text-slate-400">1 dari 4</span></div>
            <div className="mt-4 h-2 overflow-hidden bg-ivory-soft"><div className="h-full w-1/4 bg-burgundy" /></div>
            <ul className="mt-6 space-y-4 text-sm">
              <li className="flex gap-3"><span className="text-emerald-600">✓</span><span><b className="block">Akun berhasil dibuat</b><small className="text-slate-500">Email dan identitas dasar tersedia</small></span></li>
              {[["Pilih level bermain","Beginner, Intermediate, atau Professional"],["Tambahkan lokasi","Untuk rekomendasi aktivitas terdekat"],["Lengkapi gaya bermain","Posisi dan preferensi pertandingan"]].map(([title, description]) => <li key={title} className="flex gap-3 text-slate-500"><span>○</span><span><b className="block text-navy-950">{title}</b><small>{description}</small></span></li>)}
            </ul>
          </aside>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.14em] text-burgundy">Akses cepat</p><h2 className="mt-2 font-display text-3xl font-extrabold">Apa yang ingin Anda lakukan?</h2></div><span className="hidden text-xs font-bold text-slate-400 sm:block">Fitur proses akan dibangun pada tahap berikutnya</span></div>
          <div className="mt-6 grid border-l border-t border-navy-950/10 sm:grid-cols-2 lg:grid-cols-4">{quickActions.map((action, index) => <article key={action.title} className="min-h-56 border-b border-r border-navy-950/10 bg-white p-6"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center bg-navy-950 text-xl font-black text-lime">{action.icon}</span><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">0{index + 1}</span></div><h3 className="mt-7 font-display text-xl font-extrabold">{action.title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{action.description}</p><p className="mt-5 text-xs font-extrabold uppercase tracking-wider text-burgundy">Tahap berikutnya</p></article>)}</div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <div id="upcoming" className="border border-navy-950/10 bg-white p-7"><p className="text-xs font-black uppercase tracking-[.14em] text-burgundy">Aktivitas mendatang</p><div className="grid min-h-52 place-items-center text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ivory-soft text-xl">⌁</span><h3 className="mt-4 font-display text-lg font-extrabold">Belum ada jadwal bermain</h3><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Pertandingan, coaching, atau event yang Anda ikuti akan tampil di sini.</p></div></div></div>
          <div className="border border-navy-950/10 bg-white p-7"><p className="text-xs font-black uppercase tracking-[.14em] text-burgundy">Rekomendasi untuk Anda</p><div className="grid min-h-52 place-items-center text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ivory-soft text-xl">◎</span><h3 className="mt-4 font-display text-lg font-extrabold">Lengkapi profil terlebih dahulu</h3><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Rekomendasi baru dapat disusun setelah level dan lokasi bermain tersedia.</p></div></div></div>
        </section>

        <div className="mt-12 flex items-center justify-between border-t border-navy-950/10 pt-7 text-xs text-slate-500"><p>Masuk sebagai {user.email}</p><form action={logout}><button type="submit" className="font-extrabold text-burgundy hover:underline">Keluar dari akun</button></form></div>
      </main>
    </div>
  );
}

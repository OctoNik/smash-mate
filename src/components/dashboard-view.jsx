import Link from "@/components/loading-link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountHeader from "@/components/account-header";

export const instant = false;

const quickActions = [
  { icon: "◎", title: "Cari mabar", description: "Temukan aktivitas sesuai level dan waktu bermain.", label: "Lihat aktivitas", href: "/activities" },
  { icon: "+", title: "Buat match", description: "Atur jadwal dan buka slot untuk pemain lain.", label: "Buat aktivitas", href: "/activities#new" },
  { icon: "⌁", title: "Sesi latihan", description: "Buat atau ikuti latihan bersama pemain lain.", label: "Lihat latihan", href: "/activities" },
  { icon: "◇", title: "Host event", description: "Siapkan event untuk pemain atau komunitas.", label: "Buat event", href: "/activities#new" },
  { icon: "🏸", title: "Perlengkapan", description: "Ajukan kebutuhan sewa raket atau beli shuttlecock.", label: "Lihat perlengkapan", href: "/equipment" },
  { icon: "★", title: "Rating pemain", description: "Nilai pemain yang pernah ikut aktivitas bersama Anda.", label: "Beri rating", href: "/ratings" },
  { icon: "✦", title: "Feedback", description: "Bagikan masalah dan ide untuk SmashMate.", label: "Kirim masukan", href: "/feedback" },
];

export default async function DashboardView() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=Silakan masuk untuk membuka dashboard.");

  const fullName = typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
    ? user.user_metadata.full_name.trim()
    : user.email?.split("@")[0] ?? "Pemain";
  const firstName = fullName.split(" ")[0];

  return (
    <div className="dashboard-shell">
      <AccountHeader name={fullName} email={user.email ?? ""} user={user} />

      <main className="shell py-8 sm:py-10">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">Player dashboard</p><h1 className="font-display text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Halo, {firstName} 👋</h1><p className="mt-2 text-sm text-court-950/60">Atur profil, temukan aktivitas, dan siapkan perlengkapan bermain.</p></div><p className="rounded-full bg-white px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-court-700">Akun aktif · Player</p></div>

        <section className="grid gap-5 lg:grid-cols-[1.55fr_.75fr]">
          <div className="cta-court min-h-[310px] text-white"><div className="relative z-10 max-w-2xl"><div className="pill pill-dark">Langkah berikutnya</div><h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-[-.05em] sm:text-5xl">Kenali levelmu.<br /><span className="text-court-lime">Temukan cara bermain.</span></h2><p className="mt-5 max-w-lg text-sm leading-7 text-white/70">Lengkapi profil lalu jelajahi mabar, latihan, dan event yang dibuat komunitas.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/activities" className="btn btn-primary">Jelajahi aktivitas</Link><Link href="/profile" className="btn btn-outline">Edit profil</Link></div></div></div>
          <aside className="dashboard-card p-6">
            <p className="eyebrow">Akun pemain</p><h2 className="font-display text-xl font-extrabold">Selamat datang di SmashMate</h2>
            <p className="mt-4 text-sm leading-7 text-court-950/65">Gunakan menu Aktivitas untuk membuat atau mengikuti permainan. Anda juga bisa mengajukan perlengkapan dan mengirim masukan.</p>
            <div className="mt-8 rounded-xl bg-court-cream p-4 text-xs leading-6 text-court-950/70">Nama dan level bermain dapat diubah dari halaman Profil.</div>
            <Link href="/profile" className="mt-5 inline-flex text-xs font-extrabold text-court-red hover:underline">Buka profil</Link>
          </aside>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between"><div><p className="eyebrow">Akses cepat</p><h2 className="font-display text-2xl font-extrabold tracking-[-.035em] sm:text-3xl">Mau main apa hari ini?</h2></div></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{quickActions.map((action) => <Link href={action.href} key={action.title} className="quick-card group"><div className="quick-card-icon">{action.icon}</div><h3 className="mt-6 font-display text-lg font-extrabold">{action.title}</h3><p className="mt-2 text-xs leading-6 text-court-950/60">{action.description}</p><span className="mt-5 inline-flex text-[10px] font-black uppercase tracking-[.12em] text-court-700 group-hover:text-court-950">{action.label}</span></Link>)}</div>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          {[["Aktivitas saya", "⌁", "Kelola jadwal bermain", "Lihat match, latihan, atau event yang Anda buat dan ikuti.", "/activities"], ["Perlengkapan saya", "🏸", "Siapkan kebutuhan bermain", "Lihat permintaan sewa raket dan shuttlecock Anda.", "/equipment"]].map(([eyebrow, icon, title, description, href]) => <Link href={href} key={eyebrow} className="dashboard-card p-6"><p className="eyebrow">{eyebrow}</p><div className="grid min-h-44 place-items-center text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-court-cream text-court-700">{icon}</span><h3 className="mt-4 font-display text-base font-extrabold">{title}</h3><p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-court-950/60">{description}</p></div></div></Link>)}
        </section>

      </main>
    </div>
  );
}

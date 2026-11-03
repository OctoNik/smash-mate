import Link from "@/components/loading-link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountHeader from "@/components/account-header";

export const instant = false;

const kindLabels = { match: "Mabar", coaching: "Latihan", event: "Event" };

export default async function DashboardView() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=Silakan masuk untuk membuka dashboard.");
  if (user.app_metadata?.smashmate_role === "partner" && user.app_metadata?.password_setup_required === true) redirect("/partner/password");
  if (user.app_metadata?.smashmate_role === "operator") redirect("/operator");
  if (user.app_metadata?.smashmate_role === "partner") redirect("/partner");

  const fullName = typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
    ? user.user_metadata.full_name.trim() : user.email?.split("@")[0] ?? "Pemain";
  const [{ data: joinedRows }, { data: hostedRows }] = await Promise.all([
    supabase.from("activity_participants").select("activity_id").eq("user_id", user.id).limit(100),
    supabase.from("activities").select("id").eq("host_id", user.id)
      .gte("starts_at", new Date().toISOString()).limit(100),
  ]);
  const activityIds = [...new Set([...(joinedRows ?? []).map((row) => row.activity_id), ...(hostedRows ?? []).map((row) => row.id)])];
  const { data: schedule } = activityIds.length ? await supabase.from("activities")
    .select("id,host_id,kind,title,location,starts_at")
    .in("id", activityIds).gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true }).limit(3) : { data: [] };

  return <div className="dashboard-shell min-h-screen">
    <AccountHeader name={fullName} email={user.email ?? ""} user={user} />
    <main className="shell py-8 sm:py-11">
      <p className="eyebrow">Beranda pemain</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Halo, {fullName.split(" ")[0]}</h1>
      <p className="mt-2 text-sm text-court-950/65">Mau main bareng atau mencari lapangan hari ini?</p>

      <section className="mt-8 grid gap-4 md:grid-cols-2" aria-label="Mulai bermain">
        <Link href="/activities" className="dashboard-card dashboard-choice-primary flex min-h-52 flex-col justify-between p-7">
          <span className="text-xs font-extrabold uppercase tracking-widest text-court-lime">01 · Main Bareng</span>
          <div><h2 className="font-display text-2xl font-extrabold">Temukan teman bermain</h2><p className="mt-2 max-w-sm text-sm leading-6 text-white/75">Jelajahi mabar, latihan, dan event; lihat pemainnya sebelum bergabung.</p></div>
        </Link>
        <Link href="/venues" className="dashboard-card flex min-h-52 flex-col justify-between p-7 hover:border-court-700">
          <span className="text-xs font-extrabold uppercase tracking-widest text-court-red">02 · Sewa Lapangan</span>
          <div><h2 className="font-display text-2xl font-extrabold">Cari GOR dan perlengkapan</h2><p className="mt-2 max-w-sm text-sm leading-6 text-court-950/65">Booking lapangan; tambahkan raket sewa dan shuttlecock dalam satu pesanan host.</p></div>
        </Link>
      </section>

      <section className="mt-11" aria-labelledby="schedule-title">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Jadwal mendatang</p><h2 id="schedule-title" className="mt-1 font-display text-2xl font-extrabold">Aktivitas saya</h2></div><Link href="/activities?view=mine" className="text-sm font-bold text-court-700 hover:underline">Lihat semua</Link></div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {(schedule ?? []).length === 0 && <div className="dashboard-card p-6 text-sm text-court-950/65">Belum ada jadwal. Cari kegiatan yang cocok untuk Anda.</div>}
          {(schedule ?? []).map((activity) => <Link href={`/activities/${activity.id}`} key={activity.id} className="dashboard-card p-5 hover:border-court-700"><span className="activity-tag">{kindLabels[activity.kind]}</span><h3 className="mt-3 font-extrabold">{activity.title}</h3><p className="mt-2 text-xs text-court-950/65">{new Date(activity.starts_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })} WIB</p><p className="mt-1 text-xs text-court-950/65">{activity.location}</p><p className="mt-3 text-xs font-bold text-court-700">{activity.host_id === user.id ? "Anda host" : "Anda bergabung"}</p></Link>)}
        </div>
      </section>

      <section className="mt-11 border-t border-court-950/10 pt-7" aria-labelledby="more-title">
        <h2 id="more-title" className="font-display text-lg font-extrabold">Lainnya di SmashMate</h2>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
          {[["Buat aktivitas", "/activities?view=create#new"], ["Coach", "/coaches"], ["Komunitas", "/communities"], ["Rating pemain", "/ratings"], ["Kirim masukan", "/feedback"]].map(([label, href]) => <Link href={href} key={label} className="rounded-full border border-court-950/15 bg-white px-4 py-2 text-court-950 hover:bg-court-cream">{label}</Link>)}
        </div>
      </section>
    </main>
  </div>;
}

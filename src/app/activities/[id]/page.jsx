import Link from "@/components/loading-link";
import { notFound } from "next/navigation";
import ActivityParticipation from "@/components/activity-participation";
import SubmitButton from "@/components/submit-button";
import { requirePlayerAccount } from "@/lib/account";
import { deleteActivity } from "../actions";

export const instant = false;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const kindLabels = { match: "Main Bareng", coaching: "Coaching", event: "Event / kompetisi" };
const levelLabels = { beginner: "Beginner", intermediate: "Intermediate", professional: "Professional", all: "Semua level" };
const hasNotStarted = (startsAt) => new Date(startsAt).getTime() > Date.now();

export default async function ActivityDetailPage({ params }) {
  const { id } = await params;
  if (!uuid.test(id)) notFound();
  const { supabase, user } = await requirePlayerAccount();
  const { data: activity, error } = await supabase.from("activities")
    .select("id,host_id,host_name,kind,title,description,location,starts_at,capacity,level,booking_id,activity_participants(user_id,display_name,joined_at)")
    .eq("id", id).maybeSingle();
  if (error || !activity) notFound();

  const participants = (activity.activity_participants ?? []).toSorted((a, b) =>
    new Date(a.joined_at) - new Date(b.joined_at));
  const isHost = activity.host_id === user.id;
  const joined = participants.some((participant) => participant.user_id === user.id);
  const remaining = Math.max(activity.capacity - participants.length - 1, 0);
  const upcoming = hasNotStarted(activity.starts_at);
  const date = new Date(activity.starts_at).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta", dateStyle: "full", timeStyle: "short",
  });

  return <main className="shell max-w-6xl py-8 sm:py-12">
      <Link href="/activities" className="text-sm font-bold text-court-700 hover:underline">Kembali ke aktivitas</Link>
      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1.45fr_.75fr]">
        <article className="dashboard-card overflow-hidden">
          <div className="bg-court-950 px-6 py-9 text-white sm:px-9 sm:py-11">
            <div className="flex flex-wrap gap-2"><span className="activity-tag bg-white/15 text-white">{kindLabels[activity.kind]}</span><span className="activity-tag bg-white/15 text-white">{levelLabels[activity.level]}</span></div>
            <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight sm:text-4xl">{activity.title}</h1>
            <p className="mt-4 text-sm text-white/75">Diselenggarakan oleh <strong className="text-white">{activity.host_name}</strong></p>
          </div>
          <div className="p-6 sm:p-9">
            <dl className="grid gap-6 sm:grid-cols-2">
              <div><dt className="text-xs font-extrabold uppercase tracking-wider text-court-700">Jadwal</dt><dd className="mt-2 font-bold">{date} WIB</dd></div>
              <div><dt className="text-xs font-extrabold uppercase tracking-wider text-court-700">Lokasi</dt><dd className="mt-2 font-bold">{activity.location}</dd></div>
              <div><dt className="text-xs font-extrabold uppercase tracking-wider text-court-700">Peserta</dt><dd className="mt-2 font-bold">{participants.length + 1} / {activity.capacity} orang</dd></div>
              <div><dt className="text-xs font-extrabold uppercase tracking-wider text-court-700">Slot tersisa</dt><dd className="mt-2 font-bold">{remaining} orang</dd></div>
            </dl>
            <section className="mt-9 border-t border-court-950/10 pt-8">
              <h2 className="font-display text-xl font-extrabold">Tentang kegiatan</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-court-950/70">{activity.description || "Host belum menambahkan keterangan."}</p>
              {activity.booking_id && <p className="mt-4 rounded-xl bg-court-cream p-4 text-xs leading-6 text-court-950/70">Lapangan sudah dibooking oleh host. Kebutuhan raket dan shuttlecock dikelola host pada booking.</p>}
            </section>
            <section className="mt-9 border-t border-court-950/10 pt-8">
              <h2 className="font-display text-xl font-extrabold">Pemain yang ikut</h2>
              <p className="mt-1 text-sm text-court-950/60">Kenali peserta sebelum memutuskan untuk bergabung.</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                <li className="flex items-center gap-3 rounded-xl border border-court-950/10 p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-court-950 font-bold text-white">{activity.host_name.slice(0, 1).toUpperCase()}</span><span><strong className="block text-sm">{activity.host_name}</strong><small className="text-court-700">Host</small></span></li>
                {participants.map((participant) => <li key={participant.user_id} className="flex items-center gap-3 rounded-xl border border-court-950/10 p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-court-cream font-bold text-court-950">{participant.display_name.slice(0, 1).toUpperCase()}</span><span><strong className="block text-sm">{participant.display_name}</strong><small className="text-court-950/60">Peserta</small></span></li>)}
              </ul>
            </section>
          </div>
        </article>
        <aside className="dashboard-card p-6 sm:p-7 lg:sticky lg:top-24">
          <p className="eyebrow">Status keikutsertaan</p>
          <h2 className="mt-2 font-display text-xl font-extrabold">{isHost ? "Anda host kegiatan ini" : joined ? "Anda sudah bergabung" : remaining === 0 ? "Slot sudah penuh" : upcoming ? "Masih ada tempat" : "Kegiatan sudah dimulai"}</h2>
          <p className="mt-3 text-sm leading-6 text-court-950/65">{isHost ? "Jadwal dan peserta kegiatan ini dapat Anda pantau di sini." : joined ? "Kegiatan ini tersimpan di Aktivitas saya. Datang sesuai jadwal dan lokasi yang tercantum." : "Periksa jadwal, lokasi, dan daftar pemain sebelum bergabung."}</p>
          <div className="mt-6">
            {!isHost && upcoming && (joined || remaining > 0) && <ActivityParticipation key={joined ? "joined" : "available"} activityId={activity.id} joined={joined} title={activity.title} />}
            {isHost && activity.booking_id && <Link href="/bookings" className="btn btn-outline-dark">Lihat booking host</Link>}
            {(joined || isHost) && <Link href="/activities?view=mine" className="mt-4 block text-sm font-bold text-court-700 hover:underline">Lihat Aktivitas saya</Link>}
            {isHost && upcoming && <form action={deleteActivity} className="mt-6 border-t border-court-950/10 pt-5"><input type="hidden" name="id" value={activity.id} /><SubmitButton className="text-sm font-bold text-court-red hover:underline" pendingText="Menghapus..." confirmMessage="Hapus aktivitas ini dan seluruh peserta yang bergabung?">Hapus aktivitas</SubmitButton></form>}
          </div>
        </aside>
      </div>
    </main>;
}

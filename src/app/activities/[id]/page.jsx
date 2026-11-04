import Link from "@/components/loading-link";
import { notFound } from "next/navigation";
import ActivityParticipation from "@/components/activity-participation";
import SubmitButton from "@/components/submit-button";
import { requirePlayerAccount } from "@/lib/account";
import { cancelActivity, updateActivity, updateSparringDescription } from "../actions";

export const instant = false;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const kindLabels = { match: "Main Bareng", coaching: "Coaching", event: "Event / kompetisi" };
const levelLabels = { beginner: "Beginner", intermediate: "Intermediate", professional: "Professional", all: "Semua level" };
const hasNotStarted = (startsAt) => new Date(startsAt).getTime() > Date.now();
const hasFinished = (startsAt, duration) => new Date(startsAt).getTime() + duration * 60000 <= Date.now();

export default async function ActivityDetailPage({ params, searchParams }) {
  const { id } = await params;
  if (!uuid.test(id)) notFound();
  const { supabase, user } = await requirePlayerAccount();
  const query = await searchParams;
  const { data: activity, error } = await supabase.from("activities")
    .select("id,host_id,host_name,kind,title,description,location,starts_at,duration_minutes,cancelled_at,capacity,level,booking_id,community_id,sparring_opponent_id,activity_participants(user_id,display_name,joined_at)")
    .eq("id", id).maybeSingle();
  if (error || !activity) notFound();

  const participants = (activity.activity_participants ?? []).toSorted((a, b) =>
    new Date(a.joined_at) - new Date(b.joined_at));
  const isHost = activity.host_id === user.id;
  const joined = participants.some((participant) => participant.user_id === user.id);
  const remaining = Math.max(activity.capacity - participants.length - 1, 0);
  const upcoming = hasNotStarted(activity.starts_at);
  const finished = hasFinished(activity.starts_at, activity.duration_minutes);
  const { data: managedCommunities } = activity.sparring_opponent_id ? await supabase.from("communities").select("id,owner_id,community_members(user_id,role)").in("id",[activity.community_id,activity.sparring_opponent_id]) : { data: [] };
  const canEditSparring = (managedCommunities ?? []).some((community) => community.owner_id === user.id || community.community_members?.some((member) => member.user_id === user.id && member.role === "admin"));
  const date = new Date(activity.starts_at).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta", dateStyle: "full", timeStyle: "short",
  });

  return <main className="shell max-w-6xl py-8 sm:py-12">
      <Link href="/activities" className="text-sm font-bold text-court-700 hover:underline">Kembali ke aktivitas</Link>
      {query.error && <p role="alert" className="profile-message error">{query.error}</p>}{query.message && <p role="status" className="profile-message success">{query.message}</p>}
      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1.45fr_.75fr]">
        <article className="dashboard-card overflow-hidden">
          <div className="bg-court-950 px-6 py-9 text-white sm:px-9 sm:py-11">
            <div className="flex flex-wrap gap-2"><span className="activity-tag bg-white/15 text-white">{kindLabels[activity.kind]}</span><span className="activity-tag bg-white/15 text-white">{levelLabels[activity.level]}</span><span className="activity-tag bg-white/15 text-white">{activity.cancelled_at ? "Dibatalkan" : finished ? "Selesai" : upcoming ? "Mendatang" : "Sedang berlangsung"}</span></div>
            <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight sm:text-4xl">{activity.title}</h1>
            <p className="mt-4 text-sm text-white/75">Diselenggarakan oleh <strong className="text-white">{activity.host_name}</strong></p>
          </div>
          <div className="p-6 sm:p-9">
            <dl className="grid gap-6 sm:grid-cols-2">
              <div><dt className="text-xs font-extrabold uppercase tracking-wider text-court-700">Jadwal</dt><dd className="mt-2 font-bold">{date} WIB · {activity.duration_minutes} menit</dd></div>
              <div><dt className="text-xs font-extrabold uppercase tracking-wider text-court-700">Lokasi</dt><dd className="mt-2 font-bold">{activity.location}</dd></div>
              <div><dt className="text-xs font-extrabold uppercase tracking-wider text-court-700">Peserta</dt><dd className="mt-2 font-bold">{participants.length + 1} / {activity.capacity} orang</dd></div>
              <div><dt className="text-xs font-extrabold uppercase tracking-wider text-court-700">Slot tersisa</dt><dd className="mt-2 font-bold">{remaining} orang</dd></div>
            </dl>
            <section className="mt-9 border-t border-court-950/10 pt-8">
              <h2 className="font-display text-xl font-extrabold">Tentang kegiatan</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-court-950/70">{activity.description || "Host belum menambahkan keterangan."}</p>
              {canEditSparring && upcoming && !activity.cancelled_at && <form action={updateSparringDescription} className="mt-5 space-y-3"><input type="hidden" name="id" value={activity.id}/><label className="profile-label">Edit deskripsi sparring<textarea name="description" defaultValue={activity.description} maxLength={1000} rows={4} className="profile-input" /></label><SubmitButton className="btn btn-outline-dark" pendingText="Menyimpan...">Simpan deskripsi</SubmitButton></form>}
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
          <h2 className="mt-2 font-display text-xl font-extrabold">{activity.cancelled_at ? "Kegiatan dibatalkan" : finished ? "Kegiatan selesai" : isHost ? "Anda host kegiatan ini" : joined ? "Anda sudah bergabung" : remaining === 0 ? "Slot sudah penuh" : upcoming ? "Masih ada tempat" : "Sedang berlangsung"}</h2>
          <p className="mt-3 text-sm leading-6 text-court-950/65">{activity.cancelled_at ? "Kegiatan ini dibatalkan oleh host." : finished ? isHost || joined ? "Kegiatan ini tersimpan dalam riwayat aktivitas Anda." : "Kegiatan ini telah berakhir." : isHost ? "Jadwal dan peserta kegiatan ini dapat Anda pantau di sini." : joined ? "Kegiatan ini tersimpan di Aktivitas saya. Datang sesuai jadwal dan lokasi yang tercantum." : "Periksa jadwal, lokasi, dan daftar pemain sebelum bergabung."}</p>
          <div className="mt-6">
            {!isHost && upcoming && !activity.cancelled_at && (joined || remaining > 0) && <ActivityParticipation key={joined ? "joined" : "available"} activityId={activity.id} joined={joined} title={activity.title} />}
            {isHost && activity.booking_id && <Link href="/bookings" className="btn btn-outline-dark">Lihat booking host</Link>}
            {(joined || isHost) && <Link href="/activities?view=mine" className="mt-4 block text-sm font-bold text-court-700 hover:underline">Lihat Aktivitas saya</Link>}
            {isHost && upcoming && !activity.cancelled_at && <><form action={cancelActivity} className="mt-6 border-t border-court-950/10 pt-5"><input type="hidden" name="id" value={activity.id} /><SubmitButton className="text-sm font-bold text-court-red hover:underline" pendingText="Membatalkan..." confirmMessage="Batalkan kegiatan ini? Peserta tetap dapat melihat riwayatnya.">Batalkan kegiatan</SubmitButton></form><details className="mt-5"><summary className="cursor-pointer text-sm font-bold text-court-700">Edit kegiatan</summary><form action={updateActivity} className="mt-4 space-y-3"><input type="hidden" name="id" value={activity.id}/><label className="profile-label">Judul<input name="title" defaultValue={activity.title} minLength={5} maxLength={100} required className="profile-input"/></label><label className="profile-label">Deskripsi<textarea name="description" defaultValue={activity.description} maxLength={1000} rows={3} className="profile-input"/></label><label className="profile-label">Level<select name="level" defaultValue={activity.level} className="profile-input">{Object.entries(levelLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="profile-label">Kapasitas<input name="capacity" type="number" defaultValue={activity.capacity} min="2" max="100" required className="profile-input"/></label>{!activity.booking_id && <><label className="profile-label">Lokasi<input name="location" defaultValue={activity.location} minLength={3} maxLength={160} required className="profile-input"/></label><label className="profile-label">Mulai (WIB)<input name="starts_at" type="datetime-local" defaultValue={new Date(new Date(activity.starts_at).getTime()+7*3600000).toISOString().slice(0,16)} required className="profile-input"/></label><label className="profile-label">Durasi (menit)<input name="duration_minutes" type="number" defaultValue={activity.duration_minutes} min="30" max="480" step="30" required className="profile-input"/></label></>}<SubmitButton className="btn btn-dark" pendingText="Menyimpan...">Simpan perubahan</SubmitButton></form></details></>}
          </div>
        </aside>
      </div>
    </main>;
}

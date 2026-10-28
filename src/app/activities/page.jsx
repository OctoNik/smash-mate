import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { requireAccount } from "@/lib/account";
import { createActivity, deleteActivity, joinActivity, leaveActivity } from "./actions";

export const instant = false;

const kindLabels = { match: "Mabar", coaching: "Latihan", event: "Event" };
const levelLabels = { beginner: "Beginner", intermediate: "Intermediate", professional: "Professional", all: "Semua level" };

export default async function ActivitiesPage({ searchParams }) {
  const { supabase, user, name } = await requireAccount();
  const { error, message } = await searchParams;
  const { data: activities, error: listError } = await supabase
    .from("activities")
    .select("id,host_id,host_name,kind,title,description,location,starts_at,capacity,level,activity_participants(user_id)")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(50);

  return (
    <div className="dashboard-shell min-h-screen">
      <AccountHeader name={name} email={user.email ?? ""} user={user} active="activities" />
      <main className="shell py-10 sm:py-14">
        <p className="eyebrow">Aktivitas badminton</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Cari dan buat aktivitas</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-court-950/65">Buat mabar, sesi latihan, atau event. Pengguna lain dapat bergabung selama masih ada slot.</p>
        {message && <p role="status" className="profile-message success">{message}</p>}
        {error && <p role="alert" className="profile-message error">{error}</p>}
        {listError && <p role="alert" className="profile-message error">Data aktivitas belum tersedia. Jalankan migrasi Supabase di SQL Editor terlebih dahulu.</p>}

        <div className="mt-9 grid items-start gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <section id="new" className="dashboard-card p-6 sm:p-8" aria-labelledby="create-activity-title">
            <h2 id="create-activity-title" className="text-xl font-extrabold">Buat aktivitas</h2>
            <p className="mt-2 text-sm text-court-950/60">Isi jadwal dan kebutuhan pemain dengan jelas.</p>
            <form action={createActivity} className="mt-6 space-y-4">
              <label className="profile-label">Jenis aktivitas
                <select name="kind" className="profile-input" required>
                  <option value="match">Mabar / pertandingan</option>
                  <option value="coaching">Sesi latihan</option>
                  <option value="event">Event komunitas</option>
                </select>
              </label>
              <label className="profile-label">Judul
                <input name="title" type="text" className="profile-input" minLength={5} maxLength={100} required placeholder="Contoh: Mabar ganda Sabtu pagi" />
              </label>
              <label className="profile-label">Lokasi
                <input name="location" type="text" className="profile-input" minLength={3} maxLength={160} required placeholder="Nama GOR dan kota" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="profile-label">Waktu mulai (WIB)
                  <input name="starts_at" type="datetime-local" className="profile-input" required />
                </label>
                <label className="profile-label">Total slot termasuk host
                  <input name="capacity" type="number" min="2" max="100" defaultValue="4" className="profile-input" required />
                </label>
              </div>
              <label className="profile-label">Level pemain
                <select name="level" className="profile-input" required>
                  <option value="all">Semua level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="professional">Professional</option>
                </select>
              </label>
              <label className="profile-label">Keterangan
                <textarea name="description" maxLength={1000} rows={4} className="profile-input" placeholder="Format permainan, kebutuhan pemain, atau informasi lain" />
              </label>
              <SubmitButton className="btn btn-dark w-full" pendingText="Menyimpan aktivitas...">Buat aktivitas</SubmitButton>
            </form>
          </section>

          <section aria-labelledby="activity-list-title">
            <h2 id="activity-list-title" className="text-xl font-extrabold">Aktivitas mendatang</h2>
            <p className="mt-2 text-sm text-court-950/60">Menampilkan hingga 50 aktivitas terdekat.</p>
            <div className="mt-5 space-y-4">
              {!listError && activities?.length === 0 && <div className="dashboard-card p-8 text-sm text-court-950/65">Belum ada aktivitas. Anda bisa membuat yang pertama.</div>}
              {activities?.map((activity) => {
                const participants = activity.activity_participants ?? [];
                const joined = participants.some((participant) => participant.user_id === user.id);
                const host = activity.host_id === user.id;
                const remaining = Math.max(activity.capacity - participants.length - 1, 0);
                return (
                  <article className="dashboard-card p-5 sm:p-6" key={activity.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2"><span className="activity-tag">{kindLabels[activity.kind]}</span><span className="text-xs font-bold text-court-700">{levelLabels[activity.level]}</span></div>
                    <h3 className="mt-4 text-lg font-extrabold">{activity.title}</h3>
                    <p className="mt-1 text-xs font-bold text-court-700">Host: {activity.host_name}</p>
                    <p className="mt-2 text-sm leading-6 text-court-950/65">{activity.description || "Tidak ada keterangan tambahan."}</p>
                    <dl className="mt-5 grid gap-2 text-xs text-court-950/65 sm:grid-cols-2">
                      <div><dt className="font-bold text-court-950">Lokasi</dt><dd>{activity.location}</dd></div>
                      <div><dt className="font-bold text-court-950">Jadwal</dt><dd>{new Date(activity.starts_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })} WIB</dd></div>
                      <div><dt className="font-bold text-court-950">Slot tersedia</dt><dd>{remaining} dari {activity.capacity}</dd></div>
                    </dl>
                    <div className="mt-5 border-t border-court-950/10 pt-4">
                      {host ? <form action={deleteActivity}><input type="hidden" name="id" value={activity.id} /><SubmitButton className="text-sm font-bold text-court-red hover:underline" pendingText="Menghapus..." confirmMessage="Hapus aktivitas ini dan seluruh peserta yang bergabung?">Hapus aktivitas</SubmitButton></form>
                        : joined ? <form action={leaveActivity}><input type="hidden" name="id" value={activity.id} /><SubmitButton className="btn btn-outline-dark" pendingText="Memproses...">Keluar dari aktivitas</SubmitButton></form>
                          : remaining > 0 ? <form action={joinActivity}><input type="hidden" name="id" value={activity.id} /><SubmitButton className="btn btn-dark" pendingText="Bergabung...">Ikut aktivitas</SubmitButton></form>
                            : <span className="text-sm font-bold text-court-700">Slot penuh</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

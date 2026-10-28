import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { requireAccount } from "@/lib/account";
import { submitRating } from "./actions";

export const instant = false;

export default async function RatingsPage({ searchParams }) {
  const { supabase, user, name } = await requireAccount();
  const { error, message } = await searchParams;
  const select = "id,host_id,host_name,title,starts_at,activity_participants(user_id,display_name)";
  const { data: hosted, error: hostedError } = await supabase.from("activities")
    .select(select).eq("host_id", user.id).lt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: false }).limit(20);
  const { data: joined, error: joinedError } = await supabase.from("activity_participants")
    .select("activity_id").eq("user_id", user.id).order("joined_at", { ascending: false }).limit(30);
  const joinedIds = [...new Set((joined ?? []).map((item) => item.activity_id))];
  const { data: attended, error: attendedError } = joinedIds.length
    ? await supabase.from("activities").select(select).in("id", joinedIds)
      .lt("starts_at", new Date().toISOString()).order("starts_at", { ascending: false })
    : { data: [], error: null };
  const activities = [...(hosted ?? []), ...(attended ?? [])]
    .filter((activity, index, all) => all.findIndex((item) => item.id === activity.id) === index)
    .sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));
  const ids = activities.map((activity) => activity.id);
  const { data: ratings, error: ratingsError } = ids.length
    ? await supabase.from("activity_ratings").select("activity_id,recipient_id,stars")
      .eq("reviewer_id", user.id).in("activity_id", ids)
    : { data: [], error: null };
  const listError = hostedError || joinedError || attendedError || ratingsError;

  return (
    <div className="dashboard-shell min-h-screen">
      <AccountHeader name={name} email={user.email ?? ""} user={user} active="ratings" />
      <main className="shell max-w-5xl py-10 sm:py-14">
        <p className="eyebrow">Komunitas SmashMate</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Rating pemain</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-court-950/65">Beri 1–5 bintang kepada pemain yang ikut aktivitas yang sama. Rating tersedia setelah jadwal aktivitas dimulai.</p>
        {message && <p role="status" className="profile-message success">{message}</p>}
        {error && <p role="alert" className="profile-message error">{error}</p>}
        {listError && <p role="alert" className="profile-message error">Riwayat rating belum dapat dimuat. Coba lagi.</p>}
        <div className="mt-8 space-y-5">
          {!listError && activities.length === 0 && <div className="dashboard-card p-8 text-sm text-court-950/65">Belum ada aktivitas yang dapat dinilai. Ikuti aktivitas terlebih dahulu.</div>}
          {activities.map((activity) => {
            const candidates = [
              { id: activity.host_id, displayName: activity.host_name },
              ...(activity.activity_participants ?? []).map((participant) => ({ id: participant.user_id, displayName: participant.display_name })),
            ].filter((candidate) => candidate.id !== user.id);
            const rated = ratings?.filter((rating) => rating.activity_id === activity.id) ?? [];
            const available = candidates.filter((candidate) => !rated.some((rating) => rating.recipient_id === candidate.id));
            return (
              <section className="dashboard-card p-6 sm:p-8" key={activity.id}>
                <h2 className="text-lg font-extrabold">{activity.title}</h2>
                <p className="mt-1 text-xs text-court-950/60">{new Date(activity.starts_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })} WIB</p>
                {rated.length > 0 && <p className="mt-4 text-sm text-court-950/65">Anda sudah memberi rating kepada {rated.length} pemain.</p>}
                {available.length > 0 ? (
                  <form action={submitRating} className="mt-5 grid items-end gap-4 sm:grid-cols-[1fr_auto_auto]">
                    <input type="hidden" name="activity_id" value={activity.id} />
                    <label className="profile-label">Pemain
                      <select name="recipient_id" className="profile-input" required>
                        {available.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.displayName}</option>)}
                      </select>
                    </label>
                    <label className="profile-label">Bintang
                      <select name="stars" className="profile-input" defaultValue="5" required>
                        {[5, 4, 3, 2, 1].map((stars) => <option value={stars} key={stars}>{stars} ★</option>)}
                      </select>
                    </label>
                    <SubmitButton className="btn btn-dark" pendingText="Mengirim...">Kirim rating</SubmitButton>
                  </form>
                ) : <p className="mt-4 text-sm text-court-950/65">{candidates.length ? "Semua pemain sudah Anda nilai." : "Belum ada pemain lain yang bergabung."}</p>}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

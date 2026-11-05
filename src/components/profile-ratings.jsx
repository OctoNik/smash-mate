import Link from "@/components/loading-link";
import { waktuWib } from "@/lib/format";

const pageSize = 10;

async function getRatingSummary(supabase, userId) {
  let count = 0;
  let total = 0;
  // Read every batch so the average includes ratings beyond the API row limit.
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("activity_ratings")
      .select("stars").eq("recipient_id", userId).order("id")
      .range(offset, offset + 999);
    if (error) return { error };
    count += data.length;
    total += data.reduce((sum, rating) => sum + rating.stars, 0);
    if (data.length < 1000) return { count, average: count ? total / count : null };
  }
}

export default async function ProfileRatings({ supabase, userId, requestedPage }) {
  const value = typeof requestedPage === "string" && /^\d{1,6}$/.test(requestedPage)
    ? Number(requestedPage) : 1;
  const page = Math.max(1, value);
  const [summary, history] = await Promise.all([
    getRatingSummary(supabase, userId),
    supabase.from("activity_ratings")
      .select("id,reviewer_id,stars,created_at,activity_id,activities(title,host_id,host_name,starts_at,activity_participants(user_id,display_name))")
      .eq("recipient_id", userId).order("created_at", { ascending: false }).order("id")
      .range((page - 1) * pageSize, page * pageSize - 1),
  ]);
  const failed = summary.error || history.error;
  const pages = Math.max(1, Math.ceil((summary.count ?? 0) / pageSize));

  return (
    <section id="my-ratings" className="dashboard-card mt-5 scroll-mt-28 p-6 sm:p-8" aria-labelledby="my-ratings-title">
      <p className="eyebrow">Reputasi bermain</p>
      <h2 id="my-ratings-title" className="mt-2 text-xl font-extrabold">Rating saya</h2>
      <p className="mt-2 text-sm leading-6 text-court-950/60">Penilaian yang Anda terima dari pemain lain setelah bermain bersama.</p>
      {failed ? (
        <p role="alert" className="profile-message error">Rating belum dapat dimuat. Coba muat ulang halaman.</p>
      ) : summary.count === 0 ? (
        <p className="mt-5 rounded-xl bg-court-cream p-5 text-sm leading-6 text-court-950/70">Belum ada rating yang diterima. Setelah aktivitas selesai, host atau peserta lain dapat memberi Anda penilaian.</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl bg-court-cream p-5">
            <p className="font-display text-3xl font-extrabold text-court-950"><span aria-hidden="true" className="mr-2 text-court-red">★</span>{summary.average.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}<span className="ml-1 text-sm font-normal text-court-950/60">/ 5</span></p>
            <p className="text-sm text-court-950/70">Rata-rata dari <strong>{summary.count}</strong> penilaian</p>
          </div>
          <ul className="mt-5 divide-y divide-court-950/10">
            {(history.data ?? []).map((rating) => {
              const activity = rating.activities;
              const reviewer = activity?.host_id === rating.reviewer_id
                ? activity.host_name
                : activity?.activity_participants?.find((participant) => participant.user_id === rating.reviewer_id)?.display_name;
              return (
                <li key={rating.id} className="flex flex-wrap items-start justify-between gap-3 py-5">
                  <div>
                    <p className="font-bold">{reviewer || "Pemain"}</p>
                    <Link href={`/activities/${rating.activity_id}`} className="mt-1 inline-block text-sm font-semibold text-court-700 hover:underline">{activity?.title || "Lihat aktivitas"}</Link>
                    {activity?.starts_at && <p className="mt-1 text-xs text-court-950/60">Jadwal bermain: {waktuWib(activity.starts_at)}</p>}
                    <p className="mt-1 text-xs text-court-950/60">Dinilai: {waktuWib(rating.created_at)}</p>
                  </div>
                  <span aria-label={`${rating.stars} dari 5 bintang`} className="rounded-lg bg-court-cream px-3 py-2 text-sm font-extrabold text-court-red"><span aria-hidden="true">{"★".repeat(rating.stars)}{"☆".repeat(5 - rating.stars)}</span><span className="ml-2">{rating.stars}/5</span></span>
                </li>
              );
            })}
          </ul>
          {!history.data?.length && <p className="mt-4 text-sm text-court-950/60">Tidak ada penilaian pada halaman ini.</p>}
          {pages > 1 || page > 1 ? (
            <nav aria-label="Halaman rating yang diterima" className="mt-4 flex flex-wrap items-center gap-4 text-sm font-bold">
              {page > 1 && <Link href={`/profile?rating_page=${Math.min(page - 1, pages)}#my-ratings`} className="text-court-700 hover:underline">Sebelumnya</Link>}
              <span className="text-court-950/60">Halaman {page} dari {pages}</span>
              {page < pages && <Link href={`/profile?rating_page=${page + 1}#my-ratings`} className="text-court-700 hover:underline">Berikutnya</Link>}
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}

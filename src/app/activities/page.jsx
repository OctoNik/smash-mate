import Link from "@/components/loading-link";
import ActivityCreateForm from "@/components/activity-create-form";
import { requirePlayerAccount } from "@/lib/account";

export const instant = false;

const kindLabels = { match: "Mabar", coaching: "Latihan", event: "Event" };
const levelLabels = { beginner: "Beginner", intermediate: "Intermediate", professional: "Professional", all: "Semua level" };

export default async function ActivitiesPage({ searchParams }) {
  const { supabase, user } = await requirePlayerAccount();
  const { error, message, booking_id: requestedBookingId, view: requestedView } = await searchParams;
  const view = requestedView === "mine" ? "mine" : requestedView === "create" ? "create" : "explore";
  const [{ data: bookings }, { data: communities }, { data: memberships }] = await Promise.all([
    supabase.from("court_bookings").select("id,starts_at,venues(name),courts(name)")
      .eq("player_id", user.id).eq("status", "confirmed")
      .gte("starts_at", new Date().toISOString()).order("starts_at").limit(30),
    supabase.from("communities").select("id,name").eq("owner_id", user.id).order("name").limit(30),
    view === "mine" ? supabase.from("activity_participants").select("activity_id")
      .eq("user_id", user.id).limit(100) : Promise.resolve({ data: [] }),
  ]);
  const activityFields = "id,host_id,host_name,kind,title,description,location,starts_at,capacity,level,booking_id,activity_participants(user_id,display_name)";
  let activityQuery = supabase.from("activities").select(activityFields);
  if (view === "mine") {
    const joinedIds = (memberships ?? []).map((membership) => membership.activity_id);
    activityQuery = activityQuery.or(`host_id.eq.${user.id}${joinedIds.length ? `,id.in.(${joinedIds.join(",")})` : ""}`)
      .order("starts_at", { ascending: false }).limit(100);
  } else {
    activityQuery = activityQuery.gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true }).limit(50);
  }
  const { data: activities, error: listError } = await activityQuery;
  const bookingIds = (bookings ?? []).map((booking) => booking.id);
  const { data: linkedBookings } = bookingIds.length ? await supabase.from("activities")
    .select("booking_id").in("booking_id", bookingIds) : { data: [] };
  const usedBookingIds = new Set((linkedBookings ?? []).map((activity) => activity.booking_id));
  const availableBookings = (bookings ?? []).filter((booking) => !usedBookingIds.has(booking.id));
  const selectedBookingId = typeof requestedBookingId === "string" &&
    availableBookings.some((booking) => booking.id === requestedBookingId) ? requestedBookingId : "";

  return (
      <main className="shell py-10 sm:py-14">
        <p className="eyebrow">Aktivitas badminton</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Temukan teman bermain</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-court-950/65">Jelajahi mabar, latihan, dan event. Buka detail untuk melihat jadwal, host, dan pemain yang ikut sebelum bergabung.</p>
        {message && <p role="status" className="profile-message success">{message}</p>}
        {error && <p role="alert" className="profile-message error">{error}</p>}
        {listError && <p role="alert" className="profile-message error">Data aktivitas belum tersedia. Jalankan migrasi Supabase di SQL Editor terlebih dahulu.</p>}

        <nav aria-label="Pilihan aktivitas" className="mt-8 flex flex-wrap items-center gap-2 border-b border-court-950/10 pb-4">
          {[["explore", "Jelajahi"], ["mine", "Aktivitas saya"]].map(([tab, label]) =>
            <Link key={tab} href={tab === "explore" ? "/activities" : `/activities?view=${tab}`} aria-current={view === tab ? "page" : undefined}
              className={`rounded-xl px-4 py-2.5 text-sm font-extrabold ${view === tab ? "bg-court-950 text-white" : "bg-white text-court-950 hover:bg-court-cream"}`}>{label}</Link>)}
          <Link href="/activities?view=create#new" aria-current={view === "create" ? "page" : undefined} className="btn btn-dark ml-auto">Buat aktivitas</Link>
        </nav>

        {view === "create" ? <div className="mt-8 max-w-3xl">
          <section id="new" className="dashboard-card p-6 sm:p-8" aria-labelledby="create-activity-title">
            <h2 id="create-activity-title" className="text-xl font-extrabold">Buat aktivitas</h2>
            <p className="mt-2 text-sm text-court-950/60">Tentukan jenis kegiatan, lapangan, jadwal, dan siapa yang boleh ikut.</p>
            <ActivityCreateForm bookings={availableBookings} communities={communities ?? []} selectedBookingId={selectedBookingId} />
          </section>
        </div> : <section className="mt-8" aria-labelledby="activity-list-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><h2 id="activity-list-title" className="font-display text-2xl font-extrabold">{view === "mine" ? "Kegiatan yang saya buat dan ikuti" : "Aktivitas mendatang"}</h2>
                <p className="mt-2 text-sm text-court-950/60">{view === "mine" ? "Jadwal mendatang dan riwayat aktivitas Anda tersimpan di sini." : "Pilih kegiatan, baca detailnya, lalu tentukan apakah ingin ikut."}</p></div>
              {view === "mine" && <Link href="/activities" className="btn btn-outline-dark">Cari kegiatan lain</Link>}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {!listError && activities?.length === 0 && <div className="dashboard-card p-8 text-sm text-court-950/65">{view === "mine" ? "Anda belum membuat atau mengikuti aktivitas." : "Belum ada aktivitas mendatang. Anda bisa membuat yang pertama."}</div>}
              {activities?.map((activity) => {
                const participants = activity.activity_participants ?? [];
                const joined = participants.some((participant) => participant.user_id === user.id);
                const host = activity.host_id === user.id;
                const remaining = Math.max(activity.capacity - participants.length - 1, 0);
                return (
                  <Link href={`/activities/${activity.id}`} className="dashboard-card flex flex-col p-5 sm:p-6 hover:border-court-700" key={activity.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2"><span className="activity-tag">{kindLabels[activity.kind]}</span><span className="text-xs font-bold text-court-700">{view === "mine" ? host ? "Host" : joined ? "Bergabung" : "Aktivitas" : levelLabels[activity.level]}</span></div>
                    <h3 className="mt-4 text-lg font-extrabold">{activity.title}</h3>
                    <p className="mt-1 text-xs font-bold text-court-700">Host: {activity.host_name}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-court-950/65">{activity.description || "Tidak ada keterangan tambahan."}</p>
                    <dl className="mt-5 grid gap-2 text-xs text-court-950/65">
                      <div><dt className="font-bold text-court-950">Lokasi</dt><dd>{activity.location}</dd></div>
                      <div><dt className="font-bold text-court-950">Jadwal</dt><dd>{new Date(activity.starts_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })} WIB</dd></div>
                      <div><dt className="font-bold text-court-950">Pemain</dt><dd>{participants.length + 1} / {activity.capacity}{view === "explore" ? ` · ${remaining} slot tersedia` : ""}</dd></div>
                    </dl>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-court-950/10 pt-5">
                      <div className="flex -space-x-2" aria-label={`${participants.length + 1} pemain termasuk host`}>
                        <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-court-950 text-xs font-bold text-white" title={activity.host_name}>{activity.host_name.charAt(0).toUpperCase()}</span>
                        {participants.slice(0, 4).map((participant) => <span key={participant.user_id} className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-court-800 text-xs font-bold text-white" title={participant.display_name}>{participant.display_name.charAt(0).toUpperCase()}</span>)}
                      </div>
                      <span className="text-xs font-extrabold text-court-700">Lihat detail</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>}
        <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-court-950/10 pt-6 text-sm font-bold text-court-700">
          <Link href="/coaches" className="hover:underline">Cari coach</Link>
          <Link href="/communities" className="hover:underline">Jelajahi komunitas</Link>
          <Link href="/ratings" className="hover:underline">Rating pemain</Link>
        </div>
      </main>
  );
}

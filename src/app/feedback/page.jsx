import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { requireAccount } from "@/lib/account";
import { sendFeedback } from "./actions";

export const instant = false;

const categories = { bug: "Laporan masalah", idea: "Ide fitur", other: "Lainnya" };

export default async function FeedbackPage({ searchParams }) {
  const { supabase, user, name } = await requireAccount();
  const { error, message } = await searchParams;
  const { data: entries, error: listError } = await supabase
    .from("feedback")
    .select("id,category,message,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="dashboard-shell min-h-screen">
      <AccountHeader name={name} email={user.email ?? ""} user={user} active="feedback" />
      <main className="shell max-w-5xl py-10 sm:py-14">
        <p className="eyebrow">Suara pemain</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Kirim masukan</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-court-950/65">Laporkan masalah atau bagikan ide agar SmashMate bisa berkembang sesuai kebutuhan pemain.</p>
        {message && <p role="status" className="profile-message success">{message}</p>}
        {error && <p role="alert" className="profile-message error">{error}</p>}
        {listError && <p role="alert" className="profile-message error">Data masukan belum tersedia. Jalankan migrasi Supabase di SQL Editor terlebih dahulu.</p>}
        <div className="mt-9 grid items-start gap-6 lg:grid-cols-2">
          <section className="dashboard-card p-6 sm:p-8" aria-labelledby="feedback-form-title">
            <h2 id="feedback-form-title" className="text-xl font-extrabold">Masukan baru</h2>
            <form action={sendFeedback} className="mt-6 space-y-4">
              <label className="profile-label">Kategori
                <select name="category" className="profile-input" required>
                  <option value="bug">Laporan masalah</option>
                  <option value="idea">Ide fitur</option>
                  <option value="other">Lainnya</option>
                </select>
              </label>
              <label className="profile-label">Pesan
                <textarea name="message" rows={6} minLength={10} maxLength={1000} required className="profile-input" placeholder="Ceritakan pengalaman atau usulan Anda" />
              </label>
              <SubmitButton className="btn btn-dark w-full" pendingText="Mengirim masukan...">Kirim masukan</SubmitButton>
            </form>
          </section>
          <section aria-labelledby="feedback-history-title">
            <h2 id="feedback-history-title" className="text-xl font-extrabold">Riwayat masukan saya</h2>
            <div className="mt-5 space-y-4">
              {!listError && entries?.length === 0 && <div className="dashboard-card p-8 text-sm text-court-950/65">Belum ada masukan yang dikirim.</div>}
              {entries?.map((entry) => <article className="dashboard-card p-5 sm:p-6" key={entry.id}><div className="flex flex-wrap justify-between gap-2"><span className="activity-tag">{categories[entry.category]}</span><time className="text-xs text-court-950/55">{new Date(entry.created_at).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium" })}</time></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-court-950/75">{entry.message}</p></article>)}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

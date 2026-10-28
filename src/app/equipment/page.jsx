import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { requireAccount } from "@/lib/account";
import { cancelEquipmentRequest, createEquipmentRequest } from "./actions";

export const instant = false;

const kindLabels = { racket_rental: "Sewa raket", shuttle_purchase: "Beli shuttlecock" };

export default async function EquipmentPage({ searchParams }) {
  const { supabase, user, name } = await requireAccount();
  const { error, message } = await searchParams;
  const { data: requests, error: listError } = await supabase
    .from("equipment_requests")
    .select("id,kind,quantity,needed_at,notes,status,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="dashboard-shell min-h-screen">
      <AccountHeader name={name} email={user.email ?? ""} user={user} active="equipment" />
      <main className="shell py-10 sm:py-14">
        <p className="eyebrow">Perlengkapan bermain</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Sewa raket & beli shuttlecock</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-court-950/65">Kirim kebutuhan perlengkapan Anda. Permintaan ini belum menjadi pemesanan berbayar; harga, stok, dan mitra akan dikonfirmasi ketika layanan tersedia.</p>
        {message && <p role="status" className="profile-message success">{message}</p>}
        {error && <p role="alert" className="profile-message error">{error}</p>}
        {listError && <p role="alert" className="profile-message error">Data perlengkapan belum tersedia. Jalankan migrasi Supabase di SQL Editor terlebih dahulu.</p>}

        <div className="mt-9 grid items-start gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <section className="dashboard-card p-6 sm:p-8" aria-labelledby="equipment-form-title">
            <h2 id="equipment-form-title" className="text-xl font-extrabold">Ajukan kebutuhan</h2>
            <form action={createEquipmentRequest} className="mt-6 space-y-4">
              <label className="profile-label">Jenis perlengkapan
                <select name="kind" className="profile-input" required>
                  <option value="racket_rental">Sewa raket</option>
                  <option value="shuttle_purchase">Beli shuttlecock</option>
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="profile-label">Jumlah
                  <input name="quantity" type="number" min="1" max="20" defaultValue="1" className="profile-input" required />
                </label>
                <label className="profile-label">Tanggal dibutuhkan
                  <input name="needed_at" type="date" className="profile-input" required />
                </label>
              </div>
              <label className="profile-label">Catatan kebutuhan
                <textarea name="notes" rows={4} maxLength={500} className="profile-input" placeholder="Contoh: jenis raket atau tipe shuttlecock yang diinginkan" />
              </label>
              <SubmitButton className="btn btn-dark w-full" pendingText="Mengirim permintaan...">Kirim permintaan</SubmitButton>
            </form>
          </section>

          <section aria-labelledby="equipment-list-title">
            <h2 id="equipment-list-title" className="text-xl font-extrabold">Permintaan saya</h2>
            <p className="mt-2 text-sm text-court-950/60">Riwayat kebutuhan perlengkapan Anda.</p>
            <div className="mt-5 space-y-4">
              {!listError && requests?.length === 0 && <div className="dashboard-card p-8 text-sm text-court-950/65">Belum ada permintaan perlengkapan.</div>}
              {requests?.map((request) => (
                <article className="dashboard-card p-5 sm:p-6" key={request.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3"><span className="activity-tag">{kindLabels[request.kind]}</span><span className="text-xs font-bold text-court-700">{request.status === "cancelled" ? "Dibatalkan" : "Terkirim"}</span></div>
                  <h3 className="mt-4 text-lg font-extrabold">{request.quantity} {request.kind === "racket_rental" ? "raket" : "pak shuttlecock"}</h3>
                  <p className="mt-2 text-sm text-court-950/65">Dibutuhkan: {new Date(`${request.needed_at}T00:00:00+07:00`).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium" })}</p>
                  {request.notes && <p className="mt-3 text-sm leading-6 text-court-950/65">{request.notes}</p>}
                  {request.status === "submitted" && <form action={cancelEquipmentRequest} className="mt-5 border-t border-court-950/10 pt-4"><input type="hidden" name="id" value={request.id} /><SubmitButton className="text-sm font-bold text-court-red hover:underline" pendingText="Membatalkan...">Batalkan permintaan</SubmitButton></form>}
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

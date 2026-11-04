"use client";

import { useState } from "react";
import SubmitButton from "@/components/submit-button";
import { bookCourt } from "@/app/venues/actions";
import { rupiah, waktuWib } from "@/lib/format";

export default function VenueBookingFlow({ venueId, courts, rentals, shuttles, busySlots }) {
  const [courtId, setCourtId] = useState(courts[0]?.id ?? "");
  const [duration, setDuration] = useState(60);
  const [racketId, setRacketId] = useState("");
  const [racketQuantity, setRacketQuantity] = useState(0);
  const [shuttleId, setShuttleId] = useState("");
  const [shuttleQuantity, setShuttleQuantity] = useState(0);
  const court = courts.find((item) => item.id === courtId);
  const racket = rentals.find((item) => item.id === racketId);
  const shuttle = shuttles.find((item) => item.id === shuttleId);
  const estimate = (court?.price_per_hour ?? 0) * (duration / 60) +
    (racket?.price ?? 0) * racketQuantity + (shuttle?.price ?? 0) * shuttleQuantity;
  const selectedBusySlots = busySlots.filter((item) => item.court_id === courtId).slice(0, 5);

  if (!courts.length) return <p className="dashboard-card mt-6 p-6 text-sm text-court-950/65">Belum ada lapangan yang dapat dipesan saat ini.</p>;

  return <div className="mt-6 grid items-start gap-5 lg:grid-cols-[.85fr_1.15fr]">
    <div>
      <h3 className="text-sm font-extrabold text-court-950">1. Pilih lapangan</h3>
      <div className="mt-3 space-y-3" role="group" aria-label="Pilihan lapangan">
        {courts.map((item) => <button key={item.id} type="button" aria-pressed={courtId === item.id}
          onClick={() => setCourtId(item.id)}
          className={`dashboard-card flex w-full items-center justify-between gap-3 p-5 text-left ${courtId === item.id ? "booking-court-selected" : "hover:border-court-700"}`}>
          <span><strong className="block text-base">{item.name}</strong><small className="mt-1 block text-court-950/60">Pilih jadwal setelah memilih lapangan</small></span>
          <span className="shrink-0 text-sm font-extrabold text-court-700">{rupiah(item.price_per_hour)}<small className="block text-right font-normal">/ jam</small></span>
        </button>)}
      </div>
      <div className="dashboard-card mt-4 p-5 text-xs leading-6 text-court-950/70">
        <strong className="text-sm text-court-950">Jadwal terisi · {court?.name}</strong>
        {selectedBusySlots.length ? selectedBusySlots.map((slot) => <p key={`${slot.court_id}-${slot.starts_at}`}>{waktuWib(slot.starts_at)} – {new Date(slot.ends_at).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })} WIB</p>) : <p>Belum ada jadwal terisi.</p>}
      </div>
    </div>

    <form action={bookCourt} className="dashboard-card p-6 sm:p-7">
      <input type="hidden" name="venue_id" value={venueId} />
      <input type="hidden" name="court_id" value={courtId} />
      <h3 className="font-display text-xl font-extrabold">Atur booking</h3>
      <p className="mt-2 text-xs leading-5 text-court-950/60">Satu booking dibuat oleh host untuk seluruh pemain. Pembayaran hanya simulasi.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="profile-label">2. Mulai bermain (WIB)<input type="datetime-local" name="starts_at" required className="profile-input" /></label>
        <label className="profile-label">Durasi<select name="duration" value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="profile-input"><option value="60">1 jam</option><option value="120">2 jam</option></select></label>
      </div>
      <div className="mt-6 border-t border-court-950/10 pt-5">
        <h4 className="text-sm font-extrabold">3. Tambah perlengkapan <span className="font-normal text-court-950/60">(opsional)</span></h4>
        {rentals.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_110px]"><label className="profile-label">Sewa raket<select name="racket_id" value={racketId} onChange={(event) => { setRacketId(event.target.value); setRacketQuantity(event.target.value ? 1 : 0); }} className="profile-input"><option value="">Tanpa raket</option>{rentals.map((item) => <option key={item.id} value={item.id}>{item.name} · {rupiah(item.price)} / sesi</option>)}</select></label><label className="profile-label">Jumlah<input type="number" name="racket_quantity" value={racketQuantity} onChange={(event) => setRacketQuantity(Number(event.target.value))} min="0" max={Math.min(racket?.stock ?? 0, 20)} disabled={!racketId} className="profile-input" /></label></div>}
        {shuttles.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_110px]"><label className="profile-label">Beli shuttlecock<select name="shuttle_id" value={shuttleId} onChange={(event) => { setShuttleId(event.target.value); setShuttleQuantity(event.target.value ? 1 : 0); }} className="profile-input"><option value="">Tanpa shuttlecock</option>{shuttles.map((item) => <option key={item.id} value={item.id}>{item.name} · {rupiah(item.price)} / slop</option>)}</select></label><label className="profile-label">Slop<input type="number" name="shuttle_quantity" value={shuttleQuantity} onChange={(event) => setShuttleQuantity(Number(event.target.value))} min="0" max={Math.min(shuttle?.stock ?? 0, 100)} disabled={!shuttleId} className="profile-input" /></label></div>}
      </div>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 rounded-xl bg-court-cream p-4"><span><small className="block text-court-950/60">4. Estimasi total</small><strong className="text-xl text-court-950">{rupiah(estimate)}</strong></span><span className="text-xs text-court-950/55">Harga akhir dihitung saat booking.</span></div>
      <SubmitButton className="btn btn-dark mt-5 w-full" pendingText="Memeriksa slot...">Lanjut ke checkout simulasi</SubmitButton>
    </form>
  </div>;
}

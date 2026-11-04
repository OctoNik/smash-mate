"use client";

import { useState } from "react";
import SubmitButton from "@/components/submit-button";
import { bookCourt } from "@/app/venues/actions";
import { rupiah } from "@/lib/format";

const wibDate = (date) => new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
const minutes = (time) => {
  const [hour, minute] = String(time).slice(0, 5).split(":").map(Number);
  return hour * 60 + minute;
};
const clock = (value) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;

export default function VenueBookingFlow({ venueId, courts, rentals, shuttles, busySlots, openTime, closeTime }) {
  const [courtId, setCourtId] = useState(courts[0]?.id ?? "");
  const [now] = useState(() => Date.now());
  const [date, setDate] = useState(() => wibDate(new Date(now)));
  const [duration, setDuration] = useState(60);
  const [selectedTime, setSelectedTime] = useState("");
  const [racketId, setRacketId] = useState("");
  const [racketQuantity, setRacketQuantity] = useState(0);
  const [shuttleId, setShuttleId] = useState("");
  const [shuttleQuantity, setShuttleQuantity] = useState(0);
  const court = courts.find((item) => item.id === courtId);
  const racket = rentals.find((item) => item.id === racketId);
  const shuttle = shuttles.find((item) => item.id === shuttleId);
  const estimate = (court?.price_per_hour ?? 0) * (duration / 60) +
    (racket?.price ?? 0) * racketQuantity + (shuttle?.price ?? 0) * shuttleQuantity;
  const maxDate = wibDate(new Date(now + 365 * 24 * 60 * 60 * 1000));
  const slots = [];
  for (let start = minutes(openTime); start + duration <= minutes(closeTime); start += 60) {
    const label = clock(start);
    const from = Date.parse(`${date}T${label}:00+07:00`);
    const until = from + duration * 60 * 1000;
    const occupied = busySlots.some((slot) => slot.court_id === courtId &&
      new Date(slot.starts_at).getTime() < until && new Date(slot.ends_at).getTime() > from);
    slots.push({ label, end: clock(start + duration), available: from > now && !occupied });
  }
  const availableCount = slots.filter((slot) => slot.available).length;

  if (!courts.length) return <p className="dashboard-card mt-6 p-6 text-sm text-court-950/65">Belum ada lapangan yang dapat dipesan saat ini.</p>;

  return <div className="mt-6 grid items-start gap-5 lg:grid-cols-[.85fr_1.15fr]">
    <div>
      <h3 className="text-sm font-extrabold text-court-950">1. Pilih lapangan</h3>
      <div className="mt-3 space-y-3" role="group" aria-label="Pilihan lapangan">
        {courts.map((item) => <button key={item.id} type="button" aria-pressed={courtId === item.id}
          onClick={() => { setCourtId(item.id); setSelectedTime(""); }}
          className={`dashboard-card flex w-full items-center justify-between gap-3 p-5 text-left ${courtId === item.id ? "booking-court-selected" : "hover:border-court-700"}`}>
          <span><strong className="block text-base">{item.name}</strong><small className="mt-1 block text-court-950/60">{courtId === item.id ? `${availableCount} slot tersedia pada tanggal pilihan` : "Pilih untuk melihat jadwal"}</small></span>
          <span className="shrink-0 text-sm font-extrabold text-court-700">{rupiah(item.price_per_hour)}<small className="block text-right font-normal">/ jam</small></span>
        </button>)}
      </div>
      <p className="mt-4 text-xs leading-6 text-court-950/60">Jam operasional: {String(openTime).slice(0, 5)}–{String(closeTime).slice(0, 5)} WIB. Ketersediaan diperiksa lagi saat checkout.</p>
    </div>

    <form action={bookCourt} className="dashboard-card p-6 sm:p-7">
      <input type="hidden" name="venue_id" value={venueId} />
      <input type="hidden" name="court_id" value={courtId} />
      <input type="hidden" name="starts_at" value={selectedTime ? `${date}T${selectedTime}` : ""} />
      <h3 className="font-display text-xl font-extrabold">Atur booking</h3>
      <p className="mt-2 text-xs leading-5 text-court-950/60">Satu booking dibuat oleh host untuk seluruh pemain. Pembayaran hanya simulasi.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="profile-label">2. Tanggal bermain (WIB)<input type="date" value={date} onChange={(event) => { setDate(event.target.value); setSelectedTime(""); }} min={wibDate(new Date(now))} max={maxDate} required className="profile-input" /></label>
        <label className="profile-label">Durasi<select name="duration" value={duration} onChange={(event) => { setDuration(Number(event.target.value)); setSelectedTime(""); }} className="profile-input"><option value="60">1 jam</option><option value="120">2 jam</option></select></label>
      </div>
      <fieldset className="mt-5">
        <legend className="text-sm font-extrabold text-court-950">3. Pilih jam mulai</legend>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((slot) => <button key={slot.label} type="button" disabled={!slot.available} aria-pressed={selectedTime === slot.label}
            onClick={() => setSelectedTime(slot.label)} className={`rounded-xl border px-2 py-3 text-center text-xs font-bold ${selectedTime === slot.label ? "border-court-950 bg-court-950 text-white" : slot.available ? "border-court-950/20 bg-white text-court-950 hover:border-court-700 hover:bg-court-cream" : "cursor-not-allowed border-court-950/8 bg-court-cream text-court-950/40"}`}>
            {slot.label}–{slot.end}<small className="mt-1 block font-normal">{slot.available ? rupiah((court?.price_per_hour ?? 0) * (duration / 60)) : "Terisi"}</small>
          </button>)}
        </div>
        {!availableCount && <p className="mt-3 text-xs text-court-950/60">Tidak ada slot tersedia. Pilih tanggal, durasi, atau lapangan lain.</p>}
      </fieldset>
      <div className="mt-6 border-t border-court-950/10 pt-5">
        <h4 className="text-sm font-extrabold">4. Tambah perlengkapan <span className="font-normal text-court-950/60">(opsional)</span></h4>
        {rentals.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_110px]"><label className="profile-label">Sewa raket<select name="racket_id" value={racketId} onChange={(event) => { setRacketId(event.target.value); setRacketQuantity(event.target.value ? 1 : 0); }} className="profile-input"><option value="">Tanpa raket</option>{rentals.map((item) => <option key={item.id} value={item.id}>{item.name} · {rupiah(item.price)} / sesi</option>)}</select></label><label className="profile-label">Jumlah<input type="number" name="racket_quantity" value={racketQuantity} onChange={(event) => setRacketQuantity(Number(event.target.value))} min="0" max={Math.min(racket?.stock ?? 0, 20)} disabled={!racketId} className="profile-input" /></label></div>}
        {shuttles.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_110px]"><label className="profile-label">Beli shuttlecock<select name="shuttle_id" value={shuttleId} onChange={(event) => { setShuttleId(event.target.value); setShuttleQuantity(event.target.value ? 1 : 0); }} className="profile-input"><option value="">Tanpa shuttlecock</option>{shuttles.map((item) => <option key={item.id} value={item.id}>{item.name} · {rupiah(item.price)} / slop</option>)}</select></label><label className="profile-label">Slop<input type="number" name="shuttle_quantity" value={shuttleQuantity} onChange={(event) => setShuttleQuantity(Number(event.target.value))} min="0" max={Math.min(shuttle?.stock ?? 0, 100)} disabled={!shuttleId} className="profile-input" /></label></div>}
      </div>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 rounded-xl bg-court-cream p-4"><span><small className="block text-court-950/60">Estimasi total</small><strong className="text-xl text-court-950">{rupiah(estimate)}</strong></span><span className="text-xs text-court-950/55">Harga akhir dihitung saat booking.</span></div>
      <SubmitButton className="btn btn-dark mt-5 w-full" pendingText="Memeriksa slot..." disabled={!selectedTime}>Lanjut ke checkout simulasi</SubmitButton>
    </form>
  </div>;
}

"use client";

import Image from "next/image";
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
const dateUtc = (value) => new Date(`${value}T00:00:00Z`);
const addDays = (value, count) => {
  const date = dateUtc(value);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
};
const oneMonthLater = (value) => {
  const date = dateUtc(value);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();
  return new Date(Date.UTC(year, month + 1, Math.min(date.getUTCDate(), lastDay))).toISOString().slice(0, 10);
};
const dateLabel = (value, options) => dateUtc(value).toLocaleDateString("id-ID", { timeZone: "UTC", ...options });

export default function VenueBookingFlow({ venueId, courts, rentals, shuttles, busySlots, closures, openWeekdays, openTime, closeTime }) {
  const [courtId, setCourtId] = useState(courts[0]?.id ?? "");
  const [now] = useState(() => Date.now());
  const today = wibDate(new Date(now));
  const [date, setDate] = useState(today);
  const [weekStart, setWeekStart] = useState(today);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [quantities, setQuantities] = useState({});
  const court = courts.find((item) => item.id === courtId);
  const chosenItems = [...rentals, ...shuttles].filter((item) => quantities[item.id] > 0)
    .map((item) => ({ product_id: item.id, quantity: quantities[item.id] }));
  const estimate = (court?.price_per_hour ?? 0) * selectedTimes.length +
    [...rentals, ...shuttles].reduce((total, item) => total + item.price * (quantities[item.id] ?? 0), 0);
  const maxDate = oneMonthLater(today);
  const closedReason = (value) => {
    if (!openWeekdays.includes(dateUtc(value).getUTCDay())) return "Tutup rutin";
    const period = closures.find((item) => value >= item.starts_on && value <= item.ends_on);
    return period ? period.reason || "Tutup khusus" : "";
  };
  const selectedClosedReason = closedReason(date);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const chooseDate = (value) => {
    if (!value || value < today || value > maxDate) return;
    setDate(value);
    setSelectedTimes([]);
    const daysFromToday = Math.round((dateUtc(value) - dateUtc(today)) / 86400000);
    setWeekStart(addDays(today, Math.floor(daysFromToday / 7) * 7));
  };
  const slots = [];
  for (let start = minutes(openTime); !selectedClosedReason && start + 60 <= minutes(closeTime); start += 60) {
    const label = clock(start);
    const from = Date.parse(`${date}T${label}:00+07:00`);
    const until = from + 60 * 60 * 1000;
    const occupied = busySlots.some((slot) => slot.court_id === courtId &&
      new Date(slot.starts_at).getTime() < until && new Date(slot.ends_at).getTime() > from);
    slots.push({ label, end: clock(start + 60), available: from > now && !occupied });
  }
  const availableCount = slots.filter((slot) => slot.available).length;
  const selectSlot = (label) => {
    const start = minutes(label);
    const selected = selectedTimes.map(minutes);
    if (!selected.length) return setSelectedTimes([label]);
    if (selected.includes(start)) {
      if (selected.length === 1) return setSelectedTimes([]);
      if (start === selected[0]) return setSelectedTimes(selectedTimes.slice(1));
      if (start === selected.at(-1)) return setSelectedTimes(selectedTimes.slice(0, -1));
      return setSelectedTimes([label]);
    }
    if (selected.length < 8 && start === selected[0] - 60) return setSelectedTimes([label, ...selectedTimes]);
    if (selected.length < 8 && start === selected.at(-1) + 60) return setSelectedTimes([...selectedTimes, label]);
    setSelectedTimes([label]);
  };
  const updateQuantity = (item, value) => {
    const upperBound = Math.min(item.stock, item.kind === "racket_rental" ? 20 : 100);
    const quantity = Number.isFinite(value) ? Math.max(0, Math.min(upperBound, Math.trunc(value))) : 0;
    setQuantities((current) => ({ ...current, [item.id]: quantity }));
  };

  if (!courts.length) return <p className="dashboard-card mt-6 p-6 text-sm text-court-950/65">Belum ada lapangan yang dapat dipesan saat ini.</p>;

  return <div className="mt-6">
    <section className="dashboard-card p-4 sm:p-5" aria-labelledby="booking-date-title">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 id="booking-date-title" className="text-lg font-extrabold">Pilih tanggal bermain</h3><p className="mt-1 text-xs text-court-950/60">Booking tersedia sampai {dateLabel(maxDate, { day: "numeric", month: "long", year: "numeric" })}.</p></div><label className="text-xs font-bold text-court-950/70">Buka kalender<input type="date" value={date} min={today} max={maxDate} onChange={(event) => chooseDate(event.target.value)} className="profile-input mt-1 w-auto" aria-label="Pilih tanggal dari kalender" /></label></div>
      <div className="mt-5 flex items-center gap-2"><button type="button" onClick={() => setWeekStart(addDays(weekStart, -7))} disabled={weekStart <= today} className="grid h-12 w-9 shrink-0 place-items-center rounded-xl border border-court-950/15 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-35" aria-label="Tujuh hari sebelumnya">‹</button><div className="grid min-w-0 flex-1 grid-cols-7 gap-1 sm:gap-2">{weekDays.map((day) => { const closed = closedReason(day); const outside = day > maxDate; return <button type="button" key={day} disabled={outside} onClick={() => chooseDate(day)} aria-pressed={date === day} aria-label={`${dateLabel(day, { weekday: "long", day: "numeric", month: "long" })}${closed ? `, ${closed}` : ""}`} className={`min-w-0 rounded-xl px-1 py-3 text-center disabled:cursor-not-allowed disabled:opacity-30 ${date === day ? "bg-court-red text-white" : closed ? "bg-court-cream text-court-950/50 hover:bg-court-lime" : "text-court-950 hover:bg-court-cream"}`}><span className="block text-[11px] font-bold sm:text-xs">{dateLabel(day, { weekday: "short" })}</span><strong className="mt-1 block text-xs sm:text-sm">{dateLabel(day, { day: "numeric", month: "short" })}</strong>{closed && !outside && <small className="mt-1 block truncate text-[9px]">Tutup</small>}</button>; })}</div><button type="button" onClick={() => setWeekStart(addDays(weekStart, 7))} disabled={addDays(weekStart, 7) > maxDate} className="grid h-12 w-9 shrink-0 place-items-center rounded-xl border border-court-950/15 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-35" aria-label="Tujuh hari berikutnya">›</button></div>
      {selectedClosedReason && <p role="status" className="mt-4 rounded-xl bg-court-cream p-3 text-sm font-semibold text-court-red">GOR tutup pada tanggal ini: {selectedClosedReason}. Pilih tanggal lain.</p>}
    </section>
    <div className="mt-5 grid items-start gap-5 lg:grid-cols-[.85fr_1.15fr]">
    <div>
      <h3 className="text-sm font-extrabold text-court-950">1. Pilih lapangan</h3>
      <div className="mt-3 space-y-3" role="group" aria-label="Pilihan lapangan">
        {courts.map((item) => <button key={item.id} type="button" aria-pressed={courtId === item.id}
          onClick={() => { setCourtId(item.id); setSelectedTimes([]); }}
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
      <input type="hidden" name="starts_at" value={selectedTimes.length ? `${date}T${selectedTimes[0]}` : ""} />
      <input type="hidden" name="duration" value={selectedTimes.length * 60} />
      <input type="hidden" name="items_json" value={JSON.stringify(chosenItems)} />
      <h3 className="font-display text-xl font-extrabold">Atur booking</h3>
      <p className="mt-2 text-xs leading-5 text-court-950/60">Satu booking dibuat oleh host untuk seluruh pemain. Pembayaran hanya simulasi.</p>
      <fieldset className="mt-5">
        <legend className="text-sm font-extrabold text-court-950">2. Pilih jam bermain</legend>
        <p className="mt-1 text-xs text-court-950/60">Pilih beberapa slot berurutan, hingga 8 jam. Klik slot yang dipilih untuk mengurangi durasi.</p>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((slot) => <button key={slot.label} type="button" disabled={!slot.available} aria-pressed={selectedTimes.includes(slot.label)}
            onClick={() => selectSlot(slot.label)} className={`rounded-xl border px-2 py-3 text-center text-xs font-bold ${selectedTimes.includes(slot.label) ? "border-court-950 bg-court-950 text-white" : slot.available ? "border-court-950/20 bg-white text-court-950 hover:border-court-700 hover:bg-court-cream" : "cursor-not-allowed border-court-950/8 bg-court-cream text-court-950/40"}`}>
            {slot.label}–{slot.end}<small className="mt-1 block font-normal">{slot.available ? rupiah(court?.price_per_hour ?? 0) : "Terisi"}</small>
          </button>)}
        </div>
        {!availableCount && !selectedClosedReason && <p className="mt-3 text-xs text-court-950/60">Tidak ada slot tersedia. Pilih tanggal atau lapangan lain.</p>}
        {!!selectedTimes.length && <p className="mt-3 text-xs font-bold text-court-700">{selectedTimes.length} jam dipilih · {selectedTimes[0]}–{clock(minutes(selectedTimes.at(-1)) + 60)} WIB</p>}
      </fieldset>
      <div className="mt-6 border-t border-court-950/10 pt-5">
        <h4 className="text-sm font-extrabold">3. Tambah perlengkapan <span className="font-normal text-court-950/60">(opsional)</span></h4>
        {[{ title: "Sewa raket", items: rentals, unit: "raket", priceUnit: "sesi" }, { title: "Beli shuttlecock", items: shuttles, unit: "slop", priceUnit: "slop" }].map((group) => group.items.length > 0 && <div key={group.title} className="mt-5 space-y-3">
          <h5 className="text-sm font-bold">{group.title}</h5>
          {group.items.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-court-950/10 bg-white p-3 sm:flex-nowrap">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-court-cream"><Image src={item.imageUrl} alt={item.name} fill sizes="80px" className="object-cover" unoptimized={item.imageUrl.startsWith("http")} />{item.isSample && <span className="absolute bottom-0 inset-x-0 bg-court-950/85 px-1 py-0.5 text-center text-[8px] font-bold text-white">Ilustrasi</span>}</div>
            <div className="min-w-0 flex-1"><strong className="block text-sm">{item.name}</strong>{item.description && <p className="mt-1 line-clamp-2 text-xs text-court-950/60">{item.description}</p>}<p className="mt-1 text-xs font-bold text-court-700">{rupiah(item.price)} / {group.priceUnit} · Tersedia {item.stock} {group.unit}</p></div>
            <label className="profile-label w-24 shrink-0">Jumlah<input type="number" min="0" max={Math.min(item.stock, item.kind === "racket_rental" ? 20 : 100)} value={quantities[item.id] ?? 0} onChange={(event) => updateQuantity(item, Number(event.target.value))} className="profile-input" aria-label={`Jumlah ${item.name}`} /></label>
          </div>)}
        </div>)}
      </div>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 rounded-xl bg-court-cream p-4"><span><small className="block text-court-950/60">Estimasi total</small><strong className="text-xl text-court-950">{rupiah(estimate)}</strong></span><span className="text-xs text-court-950/55">Harga akhir dihitung saat booking.</span></div>
      <SubmitButton className="btn btn-dark mt-5 w-full" pendingText="Memeriksa slot..." disabled={!selectedTimes.length}>Lanjut ke checkout simulasi</SubmitButton>
    </form>
    </div>
  </div>;
}

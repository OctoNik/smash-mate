"use client";

import { useState } from "react";
import Link from "@/components/loading-link";
import SubmitButton from "@/components/submit-button";
import { createActivity } from "@/app/activities/actions";

export default function ActivityCreateForm({ bookings, communities, selectedBookingId }) {
  const [venueMode, setVenueMode] = useState(selectedBookingId || bookings.length ? "booking" : "own");
  const [bookingId, setBookingId] = useState(selectedBookingId || bookings[0]?.id || "");

  return <form action={createActivity} className="mt-6 space-y-6">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="profile-label">Jenis kegiatan
        <select name="kind" className="profile-input" required>
          <option value="match">Main bareng</option><option value="coaching">Latihan dengan coach</option><option value="event">Event komunitas</option>
        </select>
      </label>
      <label className="profile-label">Slot termasuk host
        <input name="capacity" type="number" min="2" max="100" defaultValue="4" className="profile-input" required />
      </label>
    </div>
    <label className="profile-label">Judul kegiatan
      <input name="title" type="text" className="profile-input" minLength={5} maxLength={100} required placeholder="Contoh: Mabar ganda Sabtu pagi" />
    </label>

    <fieldset className="border-t border-court-950/10 pt-6">
      <legend className="sr-only">Lokasi kegiatan</legend>
      <h3 className="font-display text-lg font-extrabold">Lapangan dan jadwal</h3>
      <p className="mt-1 text-xs leading-6 text-court-950/60">Pakai booking yang sudah dikonfirmasi, atau isi lokasi sendiri bila bermain di luar GOR mitra.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button type="button" aria-pressed={venueMode === "booking"} onClick={() => setVenueMode("booking")}
          className={`dashboard-card p-4 text-left text-sm font-bold ${venueMode === "booking" ? "booking-court-selected" : ""}`}>Pakai booking SmashMate</button>
        <button type="button" aria-pressed={venueMode === "own"} onClick={() => setVenueMode("own")}
          className={`dashboard-card p-4 text-left text-sm font-bold ${venueMode === "own" ? "booking-court-selected" : ""}`}>Lokasi sendiri</button>
      </div>
      {venueMode === "booking" ? bookings.length ? <label className="profile-label mt-4">Booking saya
        <select name="booking_id" value={bookingId} onChange={(event) => setBookingId(event.target.value)} className="profile-input" required>
          {bookings.map((booking) => <option value={booking.id} key={booking.id}>{booking.venues?.name} · {booking.courts?.name} · {new Date(booking.starts_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })} WIB</option>)}
        </select>
        <span className="mt-2 block text-xs font-normal leading-5 text-court-950/60">Jadwal dan lokasi akan mengikuti booking ini.</span>
      </label> : <div className="mt-4 rounded-xl bg-court-cream p-4 text-sm leading-6">Belum ada booking terkonfirmasi yang dapat dipakai. <Link href="/venues" className="font-bold text-court-red underline">Cari GOR dan booking lapangan</Link>.</div> : <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="profile-label">Nama lokasi<input name="location" type="text" className="profile-input" minLength={3} maxLength={160} required placeholder="Nama GOR dan kota" /></label>
        <label className="profile-label">Waktu mulai (WIB)<input name="starts_at" type="datetime-local" className="profile-input" required /></label>
      </div>}
    </fieldset>

    <div className="grid gap-4 sm:grid-cols-2">
      <label className="profile-label">Level pemain
        <select name="level" className="profile-input" required><option value="all">Semua level</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="professional">Professional</option></select>
      </label>
      {communities.length > 0 && <label className="profile-label">Penyelenggara
        <select name="community_id" className="profile-input"><option value="">Pribadi</option>{communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}</select>
      </label>}
    </div>
    <label className="profile-label">Info untuk peserta
      <textarea name="description" maxLength={1000} rows={4} className="profile-input" placeholder="Format permainan, perlengkapan yang tersedia, dan hal yang perlu diketahui" />
    </label>
    <p className="text-xs leading-6 text-court-950/60">Untuk membuat sesi latihan, aktifkan <Link href="/coaches" className="font-bold text-court-700 underline">profil coach</Link> terlebih dahulu.</p>
    <SubmitButton className="btn btn-dark w-full" pendingText="Menyimpan kegiatan..." disabled={venueMode === "booking" && !bookings.length}>Terbitkan kegiatan</SubmitButton>
  </form>;
}

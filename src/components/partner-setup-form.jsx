"use client";

import { useState } from "react";
import SubmitButton from "@/components/submit-button";
import { publishVenueComplete } from "@/app/partner/actions";

const days = [{ id: 1, label: "Sen" }, { id: 2, label: "Sel" }, { id: 3, label: "Rab" }, { id: 4, label: "Kam" }, { id: 5, label: "Jum" }, { id: 6, label: "Sab" }, { id: 0, label: "Min" }];

export default function PartnerSetupForm({ venue }) {
  const [courts, setCourts] = useState([{ name: "Lapangan 1", price: 70000 }]);
  const [products, setProducts] = useState([]);
  const changeCourt = (index, field, value) => setCourts((current) => current.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const changeProduct = (index, field, value) => setProducts((current) => current.map((item, i) => i === index ? { ...item, [field]: value } : item));

  return <form action={publishVenueComplete} className="dashboard-card mt-8 space-y-8 p-6 sm:p-8">
    <input type="hidden" name="venue_id" value={venue.id} />
    <input type="hidden" name="courts_json" value={JSON.stringify(courts)} />
    <input type="hidden" name="products_json" value={JSON.stringify(products)} />
    <section className="space-y-4"><h2 className="font-display text-xl font-extrabold">1. Informasi GOR</h2>
      <label className="profile-label">Nama GOR<input name="name" defaultValue={venue.name} required minLength={3} maxLength={100} className="profile-input" /></label>
      <label className="profile-label">Deskripsi<textarea name="description" maxLength={2000} rows={3} className="profile-input" placeholder="Fasilitas dan keunggulan GOR" /></label>
      <label className="profile-label">Aturan GOR<textarea name="venue_rules" maxLength={3000} rows={3} className="profile-input" placeholder="Contoh: Wajib memakai sepatu olahraga" /></label>
      <label className="profile-label">Alamat lengkap<input name="address" required minLength={10} maxLength={250} className="profile-input" /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="profile-label">Tautan Google Maps<input name="maps_url" type="url" required className="profile-input" placeholder="https://maps.app.goo.gl/..." /></label><label className="profile-label">Nomor kontak<input name="contact_phone" maxLength={30} className="profile-input" /></label></div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="profile-label">Buka (WIB)<input name="open_time" type="time" defaultValue="07:00" required className="profile-input" /></label><label className="profile-label">Tutup (WIB)<input name="close_time" type="time" defaultValue="22:00" required className="profile-input" /></label></div>
      <fieldset><legend className="text-sm font-bold">Hari buka rutin</legend><div className="mt-2 flex flex-wrap gap-2">{days.map((day) => <label key={day.id} className="flex items-center gap-2 rounded-xl border border-court-950/10 bg-court-cream px-3 py-2 text-sm"><input type="checkbox" name="open_weekdays" value={day.id} defaultChecked />{day.label}</label>)}</div></fieldset>
    </section>
    <section className="space-y-4 border-t border-court-950/10 pt-6"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-xl font-extrabold">2. Lapangan dan harga</h2><button type="button" className="btn btn-outline-dark" disabled={courts.length >= 30} onClick={() => setCourts((current) => [...current, { name: `Lapangan ${current.length + 1}`, price: 70000 }])}>Tambah lapangan</button></div>
      {courts.map((court, index) => <div key={index} className="grid gap-3 rounded-xl bg-court-cream p-4 sm:grid-cols-[1fr_180px_auto]"><label className="profile-label">Nama lapangan<input value={court.name} onChange={(event) => changeCourt(index, "name", event.target.value)} required maxLength={60} className="profile-input" /></label><label className="profile-label">Harga / jam (Rp)<input type="number" value={court.price} onChange={(event) => changeCourt(index, "price", Number(event.target.value))} required min={0} max={10000000} className="profile-input" /></label><button type="button" className="self-end px-3 py-3 text-xs font-bold text-court-red disabled:opacity-30" disabled={courts.length === 1} onClick={() => setCourts((current) => current.filter((_, i) => i !== index))}>Hapus</button></div>)}
    </section>
    <section className="space-y-4 border-t border-court-950/10 pt-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-extrabold">3. Katalog perlengkapan</h2><p className="mt-1 text-xs text-court-950/60">Opsional. Raket disewa per sesi; shuttlecock dijual per slop.</p></div><button type="button" className="btn btn-outline-dark" disabled={products.length >= 30} onClick={() => setProducts((current) => [...current, { kind: "racket_rental", name: "", description: "", price: 0, stock: 0 }])}>Tambah produk</button></div>
      {products.map((product, index) => <div key={index} className="grid gap-3 rounded-xl bg-court-cream p-4 sm:grid-cols-2"><label className="profile-label">Jenis<select value={product.kind} onChange={(event) => changeProduct(index, "kind", event.target.value)} className="profile-input"><option value="racket_rental">Sewa raket</option><option value="shuttlecock_sale">Jual shuttlecock</option></select></label><label className="profile-label">Nama / merek<input value={product.name} onChange={(event) => changeProduct(index, "name", event.target.value)} required minLength={3} maxLength={100} className="profile-input" /></label><label className="profile-label sm:col-span-2">Deskripsi<input value={product.description} onChange={(event) => changeProduct(index, "description", event.target.value)} maxLength={500} className="profile-input" /></label><label className="profile-label">Harga (Rp)<input type="number" value={product.price} onChange={(event) => changeProduct(index, "price", Number(event.target.value))} min={0} max={10000000} required className="profile-input" /></label><label className="profile-label">Stok<input type="number" value={product.stock} onChange={(event) => changeProduct(index, "stock", Number(event.target.value))} min={0} max={100000} required className="profile-input" /></label><button type="button" className="w-fit text-xs font-bold text-court-red" onClick={() => setProducts((current) => current.filter((_, i) => i !== index))}>Hapus produk ini</button></div>)}
    </section>
    <section className="space-y-3 border-t border-court-950/10 pt-6"><h2 className="font-display text-xl font-extrabold">4. Foto GOR</h2><p className="text-xs text-court-950/60">Unggah maksimal empat foto saat setup (masing-masing 3 MB). Foto pertama menjadi sampul. Anda bisa menambah foto dan foto produk nanti di Kelola GOR.</p><input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple className="profile-input text-sm" /></section>
    <SubmitButton className="btn btn-dark w-full" pendingText="Menerbitkan GOR...">Selesaikan setup dan terbitkan GOR</SubmitButton>
  </form>;
}

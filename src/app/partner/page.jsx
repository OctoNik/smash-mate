import { redirect } from "next/navigation";
import Image from "next/image";
import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { requirePartnerAccount } from "@/lib/account";
import { sampleEquipmentImage, sampleVenueImage } from "@/lib/venue-images";
import { addCourt, addProduct, addVenueClosure, hideProduct, removeVenueClosure, removeVenuePhoto, updateCourt, updateProduct, updateVenue, uploadProductImage, uploadVenuePhoto } from "./actions";

export const instant = false;
const weekdays = [{ id: 1, label: "Senin" }, { id: 2, label: "Selasa" }, { id: 3, label: "Rabu" }, { id: 4, label: "Kamis" }, { id: 5, label: "Jumat" }, { id: 6, label: "Sabtu" }, { id: 0, label: "Minggu" }];
const longDate = (value) => new Date(`${value}T12:00:00+07:00`).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric" });

export default async function PartnerPage({ searchParams }) {
  const { supabase, user, name } = await requirePartnerAccount();
  const { error, message } = await searchParams;
  const { data: venue } = await supabase.from("venues")
    .select("id,name,description,venue_rules,open_weekdays,address,maps_url,contact_phone,status,open_time,close_time")
    .eq("owner_id", user.id).order("created_at").limit(1).maybeSingle();
  if (!venue) return <div className="dashboard-shell min-h-screen"><AccountHeader name={name} email={user.email ?? ""} user={user} active="partner" /><main className="shell py-12"><h1 className="font-display text-3xl font-extrabold">GOR belum terhubung</h1><p className="mt-3 text-sm text-court-950/65">Akun ini belum memiliki GOR. Hubungi operator SmashMate untuk memeriksa pembuatan akun.</p></main></div>;
  if (venue.status === "draft") redirect("/partner/setup");

  const [{ data: courts }, { data: products }, { data: closures }, { data: photos }] = await Promise.all([
    supabase.from("courts").select("id,name,price_per_hour,is_active").eq("venue_id", venue.id).order("name"),
    supabase.from("venue_products").select("id,kind,name,description,price,stock,image_path,is_active").eq("venue_id", venue.id).order("created_at"),
    supabase.from("venue_closures").select("id,starts_on,ends_on,reason").eq("venue_id", venue.id).order("starts_on").limit(50),
    supabase.from("venue_photos").select("id,image_path,created_at").eq("venue_id", venue.id).order("created_at").limit(8),
  ]);
  return <div className="dashboard-shell min-h-screen">
    <AccountHeader name={name} email={user.email ?? ""} user={user} active="partner" />
    <main className="shell py-10 sm:py-14">
      <p className="eyebrow">Panel Mitra GOR</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Kelola {venue.name}</h1>
      <p className="mt-3 text-sm text-court-950/65">Perbarui informasi, jadwal, foto, lapangan, dan katalog GOR kapan saja. Booking pemain ada di tab Dashboard Booking.</p>
      {error && <p role="alert" className="profile-message error">{error}</p>}
      {message && <p role="status" className="profile-message success">{message}</p>}
      <nav aria-label="Bagian panel Mitra" className="mt-7 flex flex-wrap gap-2 text-sm font-bold">
        <a href="#venue-heading" className="rounded-xl bg-white px-4 py-2.5 text-court-950 hover:bg-court-cream">Informasi GOR</a>
        <a href="#schedule-heading" className="rounded-xl bg-white px-4 py-2.5 text-court-950 hover:bg-court-cream">Jadwal buka</a>
        <a href="#photos-heading" className="rounded-xl bg-white px-4 py-2.5 text-court-950 hover:bg-court-cream">Foto GOR</a>
        <a href="#courts-heading" className="rounded-xl bg-white px-4 py-2.5 text-court-950 hover:bg-court-cream">Lapangan</a>
        <a href="#products-heading" className="rounded-xl bg-white px-4 py-2.5 text-court-950 hover:bg-court-cream">Katalog</a>
      </nav>

      <section className="dashboard-card mt-9 scroll-mt-28 p-6 sm:p-8" aria-labelledby="venue-heading">
        <h2 id="venue-heading" className="text-xl font-extrabold">Informasi GOR</h2>
        <form action={updateVenue} className="mt-5 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={venue.id} />
          <label className="profile-label sm:col-span-2">Nama GOR<input name="name" defaultValue={venue.name} minLength={3} maxLength={100} required className="profile-input" /></label>
          <label className="profile-label sm:col-span-2">Deskripsi<textarea name="description" defaultValue={venue.description} maxLength={2000} rows={3} className="profile-input" /></label>
          <label className="profile-label sm:col-span-2">Aturan GOR<textarea name="venue_rules" defaultValue={venue.venue_rules} maxLength={3000} rows={4} placeholder="Contoh: Wajib memakai sepatu olahraga. Dilarang merokok di area lapangan." className="profile-input" /></label>
          <label className="profile-label sm:col-span-2">Alamat<input name="address" defaultValue={venue.address} minLength={10} maxLength={250} required className="profile-input" /></label>
          <label className="profile-label">Google Maps<input name="maps_url" type="url" defaultValue={venue.maps_url} required className="profile-input" /></label>
          <label className="profile-label">Nomor kontak<input name="contact_phone" defaultValue={venue.contact_phone} maxLength={30} className="profile-input" /></label>
          <label className="profile-label">Buka (WIB)<input name="open_time" type="time" defaultValue={String(venue.open_time).slice(0, 5)} required className="profile-input" /></label>
          <label className="profile-label">Tutup (WIB)<input name="close_time" type="time" defaultValue={String(venue.close_time).slice(0, 5)} required className="profile-input" /></label>
          <fieldset className="sm:col-span-2"><legend className="text-sm font-bold">Hari buka rutin</legend><p className="mt-1 text-xs text-court-950/60">Pilih hari ketika GOR menerima booking. Minimal satu hari.</p><div className="mt-3 flex flex-wrap gap-2">{weekdays.map((day) => <label key={day.id} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-court-950/15 bg-court-cream px-3 py-2 text-sm"><input type="checkbox" name="open_weekdays" value={day.id} defaultChecked={venue.open_weekdays?.includes(day.id)} />{day.label}</label>)}</div></fieldset>
          <div className="sm:col-span-2"><SubmitButton className="btn btn-dark" pendingText="Menyimpan...">Simpan profil GOR</SubmitButton></div>
        </form>
      </section>

      <section className="dashboard-card mt-6 scroll-mt-28 p-6 sm:p-8" aria-labelledby="photos-heading">
        <h2 id="photos-heading" className="text-xl font-extrabold">Foto GOR</h2>
        <p className="mt-2 text-sm text-court-950/65">Unggah hingga delapan foto lapangan. Foto pertama menjadi sampul pada daftar GOR; sebelum diunggah, SmashMate menampilkan gambar ilustrasi.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(photos ?? []).length === 0 && <div className="relative aspect-[4/3] overflow-hidden rounded-xl"><Image src={sampleVenueImage(venue.id)} alt="Ilustrasi sementara lapangan badminton" fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" /><span className="absolute bottom-2 left-2 rounded-lg bg-court-950 px-2 py-1 text-xs font-bold text-white">Ilustrasi sementara</span></div>}
          {(photos ?? []).map((photo, index) => <article key={photo.id} className="overflow-hidden rounded-xl border border-court-950/10"><div className="relative aspect-[4/3]"><Image src={supabase.storage.from("venue-products").getPublicUrl(photo.image_path).data.publicUrl} alt={`Foto ${venue.name} ${index + 1}`} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" unoptimized /></div><div className="flex items-center justify-between gap-2 p-3"><span className="text-xs font-bold">{index === 0 ? "Sampul GOR" : `Foto ${index + 1}`}</span><form action={removeVenuePhoto}><input type="hidden" name="venue_id" value={venue.id} /><input type="hidden" name="photo_id" value={photo.id} /><SubmitButton className="text-xs font-bold text-court-red hover:underline" pendingText="Menghapus..." confirmMessage="Hapus foto GOR ini?">Hapus</SubmitButton></form></div></article>)}
        </div>
        {(photos ?? []).length < 8 && <form action={uploadVenuePhoto} className="mt-5 flex flex-wrap items-end gap-3"><input type="hidden" name="venue_id" value={venue.id} /><label className="profile-label min-w-64 flex-1">Foto baru (JPG, PNG, WebP; maks. 3 MB)<input type="file" name="image" accept="image/jpeg,image/png,image/webp" required className="profile-input text-xs" /></label><SubmitButton className="btn btn-dark" pendingText="Mengunggah...">Unggah foto</SubmitButton></form>}
      </section>

      <section className="dashboard-card mt-6 scroll-mt-28 p-6 sm:p-8" aria-labelledby="schedule-heading">
        <h2 id="schedule-heading" className="text-xl font-extrabold">Tanggal tutup khusus</h2>
        <p className="mt-2 text-sm text-court-950/65">Tutup satu hari atau satu rentang tanggal, misalnya selama Ramadan. Periode yang sudah memiliki booking aktif tidak bisa ditutup.</p>
        <form action={addVenueClosure} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_1.5fr_auto] sm:items-end">
          <input type="hidden" name="venue_id" value={venue.id} />
          <label className="profile-label">Mulai tutup<input type="date" name="starts_on" required className="profile-input" /></label>
          <label className="profile-label">Sampai tanggal<input type="date" name="ends_on" required className="profile-input" /></label>
          <label className="profile-label">Alasan (opsional)<input name="reason" maxLength={120} placeholder="Libur Ramadan" className="profile-input" /></label>
          <SubmitButton className="btn btn-dark" pendingText="Menyimpan...">Tambah</SubmitButton>
        </form>
        <div className="mt-5 grid gap-3 md:grid-cols-2">{(closures ?? []).length === 0 && <p className="text-sm text-court-950/60">Belum ada tanggal tutup khusus.</p>}{(closures ?? []).map((closure) => <article key={closure.id} className="flex items-start justify-between gap-3 rounded-xl border border-court-950/10 bg-court-cream p-4"><div><p className="text-sm font-bold">{longDate(closure.starts_on)}{closure.ends_on !== closure.starts_on && ` – ${longDate(closure.ends_on)}`}</p><p className="mt-1 text-xs text-court-950/60">{closure.reason || "GOR tutup"}</p></div><form action={removeVenueClosure}><input type="hidden" name="id" value={closure.id} /><input type="hidden" name="venue_id" value={venue.id} /><SubmitButton className="text-xs font-bold text-court-red hover:underline" pendingText="Menghapus..." confirmMessage="Hapus periode tutup ini?">Hapus</SubmitButton></form></article>)}</div>
      </section>

      <section className="mt-12 scroll-mt-28" aria-labelledby="courts-heading">
        <h2 id="courts-heading" className="text-xl font-extrabold">Lapangan ({courts?.length ?? 0})</h2>
        <p className="mt-2 text-sm text-court-950/60">Nonaktifkan lapangan yang sedang tidak bisa dipesan.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(courts ?? []).map((court) => <form action={updateCourt} className="dashboard-card space-y-3 p-5" key={court.id}>
            <input type="hidden" name="id" value={court.id} />
            <label className="profile-label">Nama<input name="name" defaultValue={court.name} maxLength={60} required className="profile-input" /></label>
            <label className="profile-label">Harga / jam (Rp)<input name="price" type="number" min="0" max="10000000" defaultValue={court.price_per_hour} required className="profile-input" /></label>
            <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={court.is_active} /> Dapat dipesan</label>
            <SubmitButton className="btn btn-outline-dark" pendingText="Menyimpan...">Simpan lapangan</SubmitButton>
          </form>)}
          <form action={addCourt} className="dashboard-card space-y-3 p-5">
            <input type="hidden" name="venue_id" value={venue.id} />
            <h3 className="font-extrabold">Tambah lapangan</h3>
            <label className="profile-label">Nama<input name="name" maxLength={60} required className="profile-input" placeholder="Lapangan 3" /></label>
            <label className="profile-label">Harga / jam (Rp)<input name="price" type="number" min="0" max="10000000" required className="profile-input" /></label>
            <SubmitButton className="btn btn-dark" pendingText="Menambah...">Tambah lapangan</SubmitButton>
          </form>
        </div>
      </section>

      <section className="mt-12 scroll-mt-28" aria-labelledby="products-heading">
        <h2 id="products-heading" className="text-xl font-extrabold">Katalog perlengkapan</h2>
        <p className="mt-2 text-sm text-court-950/60">Harga sewa raket berlaku per sesi, dengan stok jumlah raket tersedia. Shuttlecock dijual per slop, dengan stok jumlah slop.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(products ?? []).map((product) => {
            const imageUrl = product.image_path ? supabase.storage.from("venue-products").getPublicUrl(product.image_path).data.publicUrl : sampleEquipmentImage(product.kind, product.name);
            return <article className="dashboard-card overflow-hidden" key={product.id}>
              <div className="relative h-40 bg-court-cream"><Image src={imageUrl} alt={product.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" unoptimized={imageUrl.startsWith("http")} />{!product.image_path && <span className="absolute bottom-2 left-2 rounded-lg bg-court-950/90 px-2 py-1 text-[10px] font-bold text-white">Ilustrasi produk</span>}</div>
              <div className="space-y-4 p-5">
                <span className="activity-tag">{product.kind === "racket_rental" ? "Sewa raket" : "Jual shuttlecock"}{!product.is_active && " · Disembunyikan"}</span>
                <p className="text-xs text-court-950/60">{product.description || "Belum ada deskripsi."}</p>
                <form action={updateProduct} className="space-y-3">
                  <input type="hidden" name="id" value={product.id} />
                  <label className="profile-label">Nama<input name="name" defaultValue={product.name} required maxLength={100} className="profile-input" /></label>
                  <label className="profile-label">Deskripsi<textarea name="description" defaultValue={product.description} maxLength={500} rows={2} className="profile-input" /></label>
                  <div className="grid grid-cols-2 gap-3"><label className="profile-label">Harga / {product.kind === "racket_rental" ? "sesi" : "slop"} (Rp)<input name="price" type="number" min="0" max="10000000" defaultValue={product.price} required className="profile-input" /></label><label className="profile-label">Stok ({product.kind === "racket_rental" ? "raket" : "slop"})<input name="stock" type="number" min="0" max="100000" defaultValue={product.stock} required className="profile-input" /></label></div>
                  <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={product.is_active} /> Tampil di katalog</label>
                  <SubmitButton className="btn btn-outline-dark" pendingText="Menyimpan...">Simpan produk</SubmitButton>
                </form>
                <form action={uploadProductImage} className="border-t border-court-950/10 pt-4">
                  <input type="hidden" name="product_id" value={product.id} /><input type="hidden" name="venue_id" value={venue.id} />
                  <label className="profile-label">Foto produk (maks. 3 MB)<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required className="profile-input text-xs" /></label>
                  <SubmitButton className="btn btn-outline-dark mt-3" pendingText="Mengunggah...">Unggah foto</SubmitButton>
                </form>
                {product.is_active && <form action={hideProduct} className="border-t border-court-950/10 pt-4"><input type="hidden" name="id" value={product.id} /><SubmitButton className="text-xs font-bold text-court-red hover:underline" pendingText="Menyembunyikan..." confirmMessage="Sembunyikan produk ini dari katalog pemain? Riwayat booking tetap tersimpan.">Hapus dari katalog</SubmitButton></form>}
              </div>
            </article>;
          })}
          <form action={addProduct} className="dashboard-card space-y-3 p-5">
            <input type="hidden" name="venue_id" value={venue.id} />
            <h3 className="font-extrabold">Tambah produk</h3>
            <label className="profile-label">Jenis<select name="kind" className="profile-input"><option value="racket_rental">Sewa raket</option><option value="shuttlecock_sale">Jual shuttlecock</option></select></label>
            <label className="profile-label">Nama<input name="name" required minLength={3} maxLength={100} className="profile-input" /></label>
            <label className="profile-label">Deskripsi<textarea name="description" maxLength={500} rows={3} className="profile-input" /></label>
            <p className="text-xs text-court-950/60">Untuk raket, harga per sesi dan stok jumlah raket. Untuk shuttlecock, harga dan stok per slop.</p>
            <div className="grid grid-cols-2 gap-3"><label className="profile-label">Harga (Rp)<input name="price" type="number" min="0" max="10000000" required className="profile-input" /></label><label className="profile-label">Stok<input name="stock" type="number" min="0" max="100000" required className="profile-input" /></label></div>
            <SubmitButton className="btn btn-dark" pendingText="Menambah...">Tambah produk</SubmitButton>
          </form>
        </div>
      </section>

    </main>
  </div>;
}

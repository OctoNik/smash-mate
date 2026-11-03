import { redirect } from "next/navigation";
import AccountHeader from "@/components/account-header";
import SubmitButton from "@/components/submit-button";
import { requireAccount } from "@/lib/account";
import { rupiah, waktuWib } from "@/lib/format";
import { addCourt, addProduct, updateCourt, updateProduct, updateVenue, uploadProductImage } from "./actions";

export const instant = false;
const status = { pending_payment: "Menunggu checkout", confirmed: "Dikonfirmasi", cancelled: "Dibatalkan" };

export default async function PartnerPage({ searchParams }) {
  const { supabase, user, name } = await requireAccount();
  const { error, message } = await searchParams;
  const { data: venue } = await supabase.from("venues")
    .select("id,name,description,address,maps_url,contact_phone,status,open_time,close_time")
    .eq("owner_id", user.id).order("created_at").limit(1).maybeSingle();
  if (!venue) return <div className="dashboard-shell min-h-screen"><AccountHeader name={name} email={user.email ?? ""} user={user} active="partner" /><main className="shell py-12"><h1 className="font-display text-3xl font-extrabold">GOR belum terhubung</h1><p className="mt-3 text-sm text-court-950/65">Akun ini belum memiliki GOR. Hubungi operator SmashMate untuk memeriksa pembuatan akun.</p></main></div>;
  if (venue.status === "draft") redirect("/partner/setup");

  const [{ data: courts }, { data: products }, { data: bookings }, { data: orders }] = await Promise.all([
    supabase.from("courts").select("id,name,price_per_hour,is_active").eq("venue_id", venue.id).order("name"),
    supabase.from("venue_products").select("id,kind,name,description,price,stock,image_path,is_active").eq("venue_id", venue.id).order("created_at"),
    supabase.from("court_bookings").select("id,player_name,starts_at,ends_at,total_amount,status,courts(name)").eq("venue_id", venue.id).order("starts_at", { ascending: false }).limit(50),
    supabase.from("venue_orders").select("id,player_name,quantity,total_amount,status,created_at,venue_products(name)").eq("venue_id", venue.id).order("created_at", { ascending: false }).limit(50),
  ]);
  return <div className="dashboard-shell min-h-screen">
    <AccountHeader name={name} email={user.email ?? ""} user={user} active="partner" />
    <main className="shell py-10 sm:py-14">
      <p className="eyebrow">Panel Mitra GOR</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Kelola {venue.name}</h1>
      <p className="mt-3 text-sm text-court-950/65">Atur lapangan dan katalog, lalu pantau pesanan pemain. Checkout pada prototipe ini adalah simulasi.</p>
      {error && <p role="alert" className="profile-message error">{error}</p>}
      {message && <p role="status" className="profile-message success">{message}</p>}

      <section className="dashboard-card mt-9 p-6 sm:p-8" aria-labelledby="venue-heading">
        <h2 id="venue-heading" className="text-xl font-extrabold">Informasi GOR</h2>
        <form action={updateVenue} className="mt-5 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={venue.id} />
          <label className="profile-label sm:col-span-2">Deskripsi<textarea name="description" defaultValue={venue.description} maxLength={2000} rows={3} className="profile-input" /></label>
          <label className="profile-label sm:col-span-2">Alamat<input name="address" defaultValue={venue.address} minLength={10} maxLength={250} required className="profile-input" /></label>
          <label className="profile-label">Google Maps<input name="maps_url" type="url" defaultValue={venue.maps_url} required className="profile-input" /></label>
          <label className="profile-label">Nomor kontak<input name="contact_phone" defaultValue={venue.contact_phone} maxLength={30} className="profile-input" /></label>
          <label className="profile-label">Buka (WIB)<input name="open_time" type="time" defaultValue={String(venue.open_time).slice(0, 5)} required className="profile-input" /></label>
          <label className="profile-label">Tutup (WIB)<input name="close_time" type="time" defaultValue={String(venue.close_time).slice(0, 5)} required className="profile-input" /></label>
          <div className="sm:col-span-2"><SubmitButton className="btn btn-dark" pendingText="Menyimpan...">Simpan profil GOR</SubmitButton></div>
        </form>
      </section>

      <section className="mt-12" aria-labelledby="courts-heading">
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

      <section className="mt-12" aria-labelledby="products-heading">
        <h2 id="products-heading" className="text-xl font-extrabold">Katalog perlengkapan</h2>
        <p className="mt-2 text-sm text-court-950/60">Stok dan harga disimpan per produk. Sewa raket tersedia saat booking; shuttlecock juga dapat dibeli terpisah.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(products ?? []).map((product) => {
            const imageUrl = product.image_path ? supabase.storage.from("venue-products").getPublicUrl(product.image_path).data.publicUrl : null;
            return <article className="dashboard-card overflow-hidden" key={product.id}>
              <div className="grid h-40 place-items-center bg-court-cream bg-cover bg-center text-4xl" style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}>{imageUrl ? "" : "🏸"}</div>
              <div className="space-y-4 p-5">
                <span className="activity-tag">{product.kind === "racket_rental" ? "Sewa raket" : "Jual shuttlecock"}</span>
                <p className="text-xs text-court-950/60">{product.description || "Belum ada deskripsi."}</p>
                <form action={updateProduct} className="space-y-3">
                  <input type="hidden" name="id" value={product.id} />
                  <label className="profile-label">Nama<input name="name" defaultValue={product.name} required maxLength={100} className="profile-input" /></label>
                  <label className="profile-label">Deskripsi<textarea name="description" defaultValue={product.description} maxLength={500} rows={2} className="profile-input" /></label>
                  <div className="grid grid-cols-2 gap-3"><label className="profile-label">Harga (Rp)<input name="price" type="number" min="0" max="10000000" defaultValue={product.price} required className="profile-input" /></label><label className="profile-label">Stok<input name="stock" type="number" min="0" max="100000" defaultValue={product.stock} required className="profile-input" /></label></div>
                  <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={product.is_active} /> Tampil di katalog</label>
                  <SubmitButton className="btn btn-outline-dark" pendingText="Menyimpan...">Simpan produk</SubmitButton>
                </form>
                <form action={uploadProductImage} className="border-t border-court-950/10 pt-4">
                  <input type="hidden" name="product_id" value={product.id} /><input type="hidden" name="venue_id" value={venue.id} />
                  <label className="profile-label">Foto produk (maks. 3 MB)<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required className="profile-input text-xs" /></label>
                  <SubmitButton className="btn btn-outline-dark mt-3" pendingText="Mengunggah...">Unggah foto</SubmitButton>
                </form>
              </div>
            </article>;
          })}
          <form action={addProduct} className="dashboard-card space-y-3 p-5">
            <input type="hidden" name="venue_id" value={venue.id} />
            <h3 className="font-extrabold">Tambah produk</h3>
            <label className="profile-label">Jenis<select name="kind" className="profile-input"><option value="racket_rental">Sewa raket</option><option value="shuttlecock_sale">Jual shuttlecock</option></select></label>
            <label className="profile-label">Nama<input name="name" required minLength={3} maxLength={100} className="profile-input" /></label>
            <label className="profile-label">Deskripsi<textarea name="description" maxLength={500} rows={3} className="profile-input" /></label>
            <div className="grid grid-cols-2 gap-3"><label className="profile-label">Harga (Rp)<input name="price" type="number" min="0" max="10000000" required className="profile-input" /></label><label className="profile-label">Stok<input name="stock" type="number" min="0" max="100000" required className="profile-input" /></label></div>
            <SubmitButton className="btn btn-dark" pendingText="Menambah...">Tambah produk</SubmitButton>
          </form>
        </div>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-2" aria-label="Pesanan pemain">
        <div><h2 className="text-xl font-extrabold">Booking lapangan</h2><div className="mt-4 space-y-3">{(bookings ?? []).length === 0 && <p className="dashboard-card p-5 text-sm">Belum ada booking.</p>}{(bookings ?? []).map((booking) => <article className="dashboard-card p-5" key={booking.id}><div className="flex justify-between gap-2"><strong>{booking.courts?.name}</strong><span className="activity-tag">{status[booking.status]}</span></div><p className="mt-2 text-sm">Atas nama {booking.player_name}</p><p className="mt-1 text-xs text-court-950/60">{waktuWib(booking.starts_at)} · {rupiah(booking.total_amount)}</p></article>)}</div></div>
        <div><h2 className="text-xl font-extrabold">Pesanan shuttlecock</h2><div className="mt-4 space-y-3">{(orders ?? []).length === 0 && <p className="dashboard-card p-5 text-sm">Belum ada pesanan.</p>}{(orders ?? []).map((order) => <article className="dashboard-card p-5" key={order.id}><div className="flex justify-between gap-2"><strong>{order.venue_products?.name}</strong><span className="activity-tag">{status[order.status]}</span></div><p className="mt-2 text-sm">Atas nama {order.player_name} · {order.quantity} unit</p><p className="mt-1 text-xs text-court-950/60">{rupiah(order.total_amount)}</p></article>)}</div></div>
      </section>
    </main>
  </div>;
}

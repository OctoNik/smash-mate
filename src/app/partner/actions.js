"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/account";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const partnerError = (message) => `/partner?error=${encodeURIComponent(message)}`;
const setupError = (message) => `/partner/setup?error=${encodeURIComponent(message)}`;
const productKinds = new Set(["racket_rental", "shuttlecock_sale"]);
const mapsHosts = new Set(["google.com", "www.google.com", "maps.google.com", "maps.app.goo.gl"]);

export async function publishVenue(formData) {
  const { supabase } = await requireAccount();
  const venueId = String(formData.get("venue_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const mapsUrl = String(formData.get("maps_url") ?? "").trim();
  const contactPhone = String(formData.get("contact_phone") ?? "").trim();
  const openTime = String(formData.get("open_time") ?? "");
  const closeTime = String(formData.get("close_time") ?? "");
  const courtCount = Number(formData.get("court_count"));
  const courtPrice = Number(formData.get("court_price"));
  let map;
  try { map = new URL(mapsUrl); } catch { redirect(setupError("Masukkan tautan Google Maps yang valid.")); }
  if (!uuid.test(venueId) || name.length < 3 || name.length > 100 ||
    description.length > 2000 || address.length < 10 || address.length > 250 ||
    map.protocol !== "https:" || !mapsHosts.has(map.hostname) ||
    !/^\d{2}:\d{2}$/.test(openTime) || !/^\d{2}:\d{2}$/.test(closeTime) ||
    !Number.isInteger(courtCount) || courtCount < 1 || courtCount > 30 ||
    !Number.isInteger(courtPrice) || courtPrice < 0 || courtPrice > 10000000 ||
    contactPhone.length > 30) {
    redirect(setupError("Periksa nama, alamat, lokasi, jam buka, jumlah lapangan, dan harga."));
  }
  const { error } = await supabase.rpc("publish_venue", {
    p_venue_id: venueId, p_name: name, p_description: description,
    p_address: address, p_maps_url: mapsUrl, p_contact_phone: contactPhone,
    p_open_time: openTime, p_close_time: closeTime,
    p_court_count: courtCount, p_court_price: courtPrice,
  });
  if (error) redirect(setupError("GOR belum dapat diterbitkan. Periksa data dan coba lagi."));
  revalidatePath("/partner");
  revalidatePath("/venues");
  redirect("/partner?message=GOR berhasil diterbitkan.");
}

export async function updateVenue(formData) {
  const { supabase, user } = await requireAccount();
  const id = String(formData.get("id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const contactPhone = String(formData.get("contact_phone") ?? "").trim();
  const mapsUrl = String(formData.get("maps_url") ?? "").trim();
  const openTime = String(formData.get("open_time") ?? "");
  const closeTime = String(formData.get("close_time") ?? "");
  let map;
  try { map = new URL(mapsUrl); } catch { redirect(partnerError("Tautan Google Maps tidak valid.")); }
  if (!uuid.test(id) || description.length > 2000 || address.length < 10 || address.length > 250 ||
    contactPhone.length > 30 || map.protocol !== "https:" || !mapsHosts.has(map.hostname) ||
    !/^\d{2}:\d{2}$/.test(openTime) || !/^\d{2}:\d{2}$/.test(closeTime) || openTime >= closeTime) {
    redirect(partnerError("Periksa data GOR."));
  }
  const { data, error } = await supabase.from("venues").update({
    description, address, contact_phone: contactPhone, maps_url: mapsUrl,
    open_time: openTime, close_time: closeTime,
  }).eq("id", id).eq("owner_id", user.id).select("id").maybeSingle();
  if (error || !data) redirect(partnerError("Profil GOR belum tersimpan."));
  revalidatePath("/partner");
  revalidatePath("/venues");
  redirect("/partner?message=Profil GOR diperbarui.");
}

export async function addCourt(formData) {
  const { supabase } = await requireAccount();
  const venueId = String(formData.get("venue_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  if (!uuid.test(venueId) || name.length < 1 || name.length > 60 ||
    !Number.isInteger(price) || price < 0 || price > 10000000) redirect(partnerError("Periksa nama dan harga lapangan."));
  const { error } = await supabase.from("courts").insert({ venue_id: venueId, name, price_per_hour: price });
  if (error) redirect(partnerError("Lapangan belum ditambahkan. Pastikan namanya unik."));
  revalidatePath("/partner");
  redirect("/partner?message=Lapangan ditambahkan.");
}

export async function updateCourt(formData) {
  const { supabase } = await requireAccount();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const active = formData.get("is_active") === "on";
  if (!uuid.test(id) || name.length < 1 || name.length > 60 ||
    !Number.isInteger(price) || price < 0 || price > 10000000) redirect(partnerError("Periksa data lapangan."));
  const { data, error } = await supabase.from("courts").update({
    name, price_per_hour: price, is_active: active,
  }).eq("id", id).select("id").maybeSingle();
  if (error || !data) redirect(partnerError("Lapangan belum diperbarui."));
  revalidatePath("/partner");
  revalidatePath("/venues");
  redirect("/partner?message=Lapangan diperbarui.");
}

export async function addProduct(formData) {
  const { supabase } = await requireAccount();
  const venueId = String(formData.get("venue_id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  if (!uuid.test(venueId) || !productKinds.has(kind) || name.length < 3 || name.length > 100 ||
    description.length > 500 || !Number.isInteger(price) || price < 0 || price > 10000000 ||
    !Number.isInteger(stock) || stock < 0 || stock > 100000) redirect(partnerError("Periksa nama, harga, dan stok produk."));
  const { error } = await supabase.from("venue_products").insert({
    venue_id: venueId, kind, name, description, price, stock,
  });
  if (error) redirect(partnerError("Produk belum ditambahkan."));
  revalidatePath("/partner");
  revalidatePath("/venues");
  redirect("/partner?message=Produk ditambahkan. Anda dapat mengunggah fotonya.");
}

export async function updateProduct(formData) {
  const { supabase } = await requireAccount();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const active = formData.get("is_active") === "on";
  if (!uuid.test(id) || name.length < 3 || name.length > 100 || description.length > 500 ||
    !Number.isInteger(price) || price < 0 || price > 10000000 ||
    !Number.isInteger(stock) || stock < 0 || stock > 100000) redirect(partnerError("Periksa nama, harga, dan stok."));
  const { data, error } = await supabase.from("venue_products").update({
    name, description, price, stock, is_active: active,
  }).eq("id", id).select("id").maybeSingle();
  if (error || !data) redirect(partnerError("Produk belum diperbarui."));
  revalidatePath("/partner");
  revalidatePath("/venues");
  redirect("/partner?message=Produk diperbarui.");
}

export async function uploadProductImage(formData) {
  const { supabase, user } = await requireAccount();
  const productId = String(formData.get("product_id") ?? "");
  const venueId = String(formData.get("venue_id") ?? "");
  const file = formData.get("image");
  if (!uuid.test(productId) || !uuid.test(venueId) || !(file instanceof File) ||
    file.size < 1 || file.size > 3 * 1024 * 1024 ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    redirect(partnerError("Gunakan foto JPG, PNG, atau WebP maksimal 3 MB."));
  }
  const { data: owned } = await supabase.from("venues").select("id").eq("id", venueId).eq("owner_id", user.id).maybeSingle();
  const { data: product } = await supabase.from("venue_products").select("id").eq("id", productId).eq("venue_id", venueId).maybeSingle();
  if (!owned || !product) redirect(partnerError("Produk tidak ditemukan."));
  const bytes = Buffer.from(await file.arrayBuffer());
  const validJpeg = file.type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const validPng = file.type === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const validWebp = file.type === "image/webp" && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!validJpeg && !validPng && !validWebp) redirect(partnerError("Isi foto tidak sesuai format."));
  const path = `${venueId}/${productId}`;
  const { error: uploadError } = await supabase.storage.from("venue-products")
    .upload(path, bytes, { contentType: file.type, upsert: true, cacheControl: "3600" });
  if (uploadError) redirect(partnerError("Foto belum dapat diunggah."));
  const { error } = await supabase.from("venue_products").update({ image_path: path }).eq("id", productId);
  if (error) redirect(partnerError("Foto tersimpan, tetapi katalog belum diperbarui."));
  revalidatePath("/partner");
  revalidatePath("/venues");
  redirect("/partner?message=Foto produk diperbarui.");
}

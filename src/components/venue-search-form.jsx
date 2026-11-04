"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function VenueSearchForm({ search, maxPrice, gear }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function applyFilters(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const query = String(form.get("q") ?? "").trim().slice(0, 80);
    const price = String(form.get("max_price") ?? "");
    const equipment = String(form.get("gear") ?? "");
    if (query) params.set("q", query);
    if (["100000", "150000", "200000"].includes(price)) params.set("max_price", price);
    if (["racket", "shuttle"].includes(equipment)) params.set("gear", equipment);
    const href = params.size ? `/venues?${params.toString()}` : "/venues";
    startTransition(() => router.push(href, { scroll: false }));
  }

  return <form key={`${search}|${maxPrice}|${gear}`} className="dashboard-card mt-7 grid gap-3 p-4 sm:grid-cols-[1fr_170px_170px_auto]" action="/venues" onSubmit={applyFilters} aria-busy={pending}>
    <input name="q" defaultValue={search} maxLength={80} className="profile-input" placeholder="Cari nama GOR atau kota" aria-label="Cari GOR atau kota" />
    <select name="max_price" defaultValue={String(maxPrice || "")} className="profile-input" aria-label="Harga maksimal per jam"><option value="">Semua harga</option><option value="100000">Maks. Rp100.000</option><option value="150000">Maks. Rp150.000</option><option value="200000">Maks. Rp200.000</option></select>
    <select name="gear" defaultValue={gear} className="profile-input" aria-label="Perlengkapan tersedia"><option value="">Semua perlengkapan</option><option value="racket">Ada sewa raket</option><option value="shuttle">Ada shuttlecock</option></select>
    <button className="btn btn-dark inline-flex items-center justify-center gap-2" type="submit" disabled={pending}>{pending && <span className="submit-spinner" aria-hidden="true" />}{pending ? "Mencari..." : "Terapkan"}</button>
    <span className="sr-only" role="status" aria-live="polite">{pending ? "Memperbarui hasil pencarian GOR" : ""}</span>
  </form>;
}

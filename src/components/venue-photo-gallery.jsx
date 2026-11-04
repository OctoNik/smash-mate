"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export default function VenuePhotoGallery({ name, photos, sample }) {
  const dialogRef = useRef(null);
  const [active, setActive] = useState(0);
  const images = photos.length ? photos : [sample];
  const picture = (url, index, className = "") => <Image src={url} alt={`${name} — foto ${index + 1}`} fill sizes="(max-width: 768px) 100vw, 70vw" className={`object-cover ${className}`} unoptimized={url.startsWith("http")} />;

  return <>
    <div className={`mt-7 grid gap-2 overflow-hidden rounded-2xl ${images.length > 1 ? "md:grid-cols-[2fr_1fr]" : ""}`}>
      <button type="button" onClick={() => { setActive(0); dialogRef.current?.showModal(); }} className="relative h-72 overflow-hidden bg-court-cream text-left sm:h-96" aria-label={`Lihat foto ${name}`}>
        {picture(images[0], 0, "transition-transform duration-300 hover:scale-[1.03]")}
        {!photos.length && <span className="absolute bottom-4 left-4 rounded-lg bg-court-950/90 px-3 py-2 text-xs font-bold text-white">Ilustrasi sementara</span>}
      </button>
      {images.length > 1 && <div className="grid grid-cols-2 gap-2 md:grid-cols-1 md:grid-rows-2">
        {images.slice(1, 3).map((url, index) => <button type="button" key={url} className="relative min-h-32 overflow-hidden bg-court-cream" onClick={() => { setActive(index + 1); dialogRef.current?.showModal(); }} aria-label={`Lihat foto ${index + 2} ${name}`}>{picture(url, index + 1, "transition-transform duration-300 hover:scale-[1.03]")}{index === 1 && <span className="absolute bottom-3 right-3 rounded-lg bg-court-950/90 px-3 py-2 text-xs font-bold text-white">Lihat semua foto ({images.length})</span>}</button>)}
      </div>}
    </div>
    <dialog ref={dialogRef} className="m-auto w-[min(96vw,1000px)] max-h-[92vh] rounded-2xl border-0 bg-white p-4 text-court-950 shadow-2xl backdrop:bg-court-950/80 sm:p-6" onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current.close(); }}>
      <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-extrabold">Foto {name}</h2><p className="text-xs text-court-950/60">{active + 1} dari {images.length}{!photos.length && " · Ilustrasi sementara"}</p></div><button type="button" onClick={() => dialogRef.current?.close()} className="rounded-lg border border-court-950/15 px-3 py-2 text-sm font-bold hover:bg-court-cream">Tutup</button></div>
      <div className="relative mt-4 h-[min(60vh,600px)] overflow-hidden rounded-xl bg-court-cream">{picture(images[active], active)}</div>
      {images.length > 1 && <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{images.map((url, index) => <button key={url} type="button" onClick={() => setActive(index)} aria-label={`Pilih foto ${index + 1}`} aria-pressed={active === index} className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${active === index ? "border-court-red" : "border-transparent"}`}>{picture(url, index)}</button>)}</div>}
    </dialog>
  </>;
}

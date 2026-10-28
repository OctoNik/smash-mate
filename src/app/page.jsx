import Link from "next/link";

const features = [
  ["01", "Matchmaking selevel", "Temukan partner atau lawan berdasarkan lokasi, jadwal, posisi, dan level Beginner, Intermediate, atau Professional."],
  ["02", "Buat pertandingan", "Buka sesi mabar, tentukan jumlah pemain, level, jadwal, dan biaya per orang."],
  ["03", "Latihan dengan coach", "Coach dapat membuka sesi latihan, sementara pemain memilih program dan jadwal yang sesuai."],
  ["04", "Host event", "Buat event badminton, atur kuota peserta, kategori level, jadwal, dan informasi pendaftaran."],
  ["05", "Gabung match", "Lihat slot yang tersedia dan gabung pertandingan tanpa percakapan grup yang panjang."],
  ["06", "Booking lapangan", "Pilih lapangan dan waktu bermain langsung dari pertandingan yang akan dibuat."],
  ["07", "Rental perlengkapan", "Cek ketersediaan raket sewaan dan shuttlecock sebelum datang ke lapangan."],
  ["08", "Level & rating pemain", "Tampilkan level bermain dan berikan rating bintang setelah pertandingan selesai."],
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-navy-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-10">
          <a href="#" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-lime font-display text-lg font-black text-navy-950 shadow-[0_0_24px_rgba(210,248,36,.22)]">SM</span>
            <span><strong className="block font-display text-xl leading-none">SmashMate<span className="text-lime">.</span></strong><small className="hidden text-[8px] font-bold uppercase tracking-[.18em] text-slate-500 sm:block">Badminton matchmaker</small></span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-300 lg:flex">
            <a href="#finder" className="hover:text-lime">Cari Mabar</a><a href="#how" className="hover:text-lime">Cara Kerja</a><a href="#features" className="hover:text-lime">Fitur</a>
          </nav>
          <div className="flex items-center gap-3"><Link href="/login" className="hidden text-sm font-bold text-slate-300 hover:text-lime sm:block">Masuk</Link><Link href="/register" className="rounded bg-lime px-4 py-2.5 text-sm font-extrabold text-navy-950 transition hover:-translate-y-0.5 hover:bg-lime-dark">Gabung Main <span className="ml-1">→</span></Link></div>
        </div>
      </header>

      <main className="court-grid">
        <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-12 lg:px-10 lg:pt-16">
          <div className="pointer-events-none absolute right-[-18rem] top-10 h-96 w-[52rem] rotate-[-8deg] border border-lime/10" />
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="mb-5 text-xs font-extrabold uppercase tracking-[.16em] text-lime">Cari partner. Atur jadwal. Mulai bermain.</p>
              <h1 className="font-display text-5xl font-extrabold leading-[1.08] tracking-[-.025em] text-white sm:text-6xl lg:text-[72px]">Main badminton<br />jadi <span className="text-lime">lebih gampang.</span></h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">Temukan partner yang benar-benar selevel, isi slot pertandingan, dan main di lapangan terbaik tanpa ribet grup chat.</p>
              <div className="mt-8 flex flex-wrap gap-3"><a href="#finder" className="rounded bg-lime px-6 py-3.5 font-extrabold text-navy-950 hover:bg-lime-dark">Cari partner mabar →</a><a href="#how" className="rounded border border-white/15 bg-white/5 px-6 py-3.5 font-bold text-white hover:border-lime/50">Buat match atau latihan</a></div>
            </div>
            <div className="grid content-end gap-3 lg:col-span-4">
              <div className="border border-white/10 bg-navy-800 p-6"><p className="text-xs font-extrabold uppercase tracking-[.14em] text-lime">Satu aplikasi untuk badminton</p><ul className="mt-5 space-y-4 text-sm">{["Cari pemain yang selevel","Buat match atau sesi coaching","Host event badminton","Beri rating setelah bermain"].map(item => <li key={item} className="flex items-center gap-3 border-b border-white/10 pb-3 last:border-0 last:pb-0"><span className="text-lime">✓</span><span>{item}</span></li>)}</ul></div>
            </div>
          </div>

          <div id="finder" className="mt-12 border border-white/10 bg-navy-800 p-5 sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4"><h2 className="font-display text-xl font-bold"><span className="mr-2 text-lime">●</span>Cari sesi mabar terdekat</h2><span className="text-[10px] font-bold uppercase tracking-[.15em] text-lime">Pilih jadwal & level Anda</span></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[["Wilayah GOR",["Jakarta Selatan","Jakarta Barat","Tangerang Selatan"]],["Waktu main",["Malam ini","Besok","Akhir pekan"]],["Level",["Beginner","Intermediate","Professional"]]].map(([label, options]) => <label key={label} className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}<select className="mt-2 h-12 w-full border border-white/10 bg-navy-950 px-3 text-sm normal-case tracking-normal text-white outline-none focus:border-lime">{options.map(option => <option key={option}>{option}</option>)}</select></label>)}<button className="mt-auto h-12 bg-lime font-extrabold text-navy-950 hover:bg-lime-dark">Cari pertandingan →</button></div>
          </div>
        </section>

        <section id="how" className="bg-ivory py-24 text-navy-950">
          <div className="mx-auto max-w-7xl px-5 lg:px-10"><div className="max-w-3xl"><p className="eyebrow text-burgundy">Mulai di SmashMate</p><h2 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">Empat langkah menuju lapangan.</h2><p className="mt-5 leading-7 text-slate-600">Bagian ini menjadi onboarding singkat untuk membantu pengguna baru memahami cara memakai SmashMate sebelum mendaftar.</p></div><div className="mt-12 grid border-l border-t border-navy-950/15 md:grid-cols-2 lg:grid-cols-4">{[["01","Temukan aktivitas","Jelajahi mabar, latihan dengan coach, atau event badminton yang tersedia."],["02","Tentukan level","Pilih Beginner, Intermediate, atau Professional agar aktivitas sesuai kemampuan."],["03","Lengkapi profil","Semua akun dimulai sebagai Player. Pengajuan Coach dan komunitas tersedia setelah masuk."],["04","Mulai bermain","Gabung match, buat pertandingan, host event, lalu beri rating setelah selesai."]].map(([n,title,desc]) => <article key={n} className="min-h-64 border-b border-r border-navy-950/15 p-6"><span className="font-display text-4xl font-black text-burgundy">{n}</span><h3 className="mt-8 font-display text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{desc}</p></article>)}</div><div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="bg-navy-950 px-6 py-3.5 font-extrabold text-white">Mulai dan buat akun →</Link><Link href="/login" className="border border-navy-950/20 px-6 py-3.5 font-bold">Saya sudah punya akun</Link></div></div>
        </section>

        <section id="features" className="bg-navy-950 py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-10"><div className="mb-12 max-w-3xl"><p className="eyebrow">Apa yang bisa dilakukan?</p><h2 className="section-title">Semua yang dibutuhkan untuk berkembang dan bermain.</h2><p className="mt-5 max-w-2xl leading-7 text-slate-400">Dari mencari partner hingga latihan bersama coach dan mengadakan event, SmashMate menyatukan aktivitas badminton dalam satu tempat.</p></div><div className="grid border-l border-t border-white/10 md:grid-cols-2 lg:grid-cols-4">{features.map(([number,title,description]) => <article key={number} className="min-h-60 border-b border-r border-white/10 bg-navy-900/60 p-7 transition hover:bg-navy-800"><span className="font-mono text-xs font-extrabold text-lime">{number}</span><h3 className="mt-7 font-display text-xl font-extrabold text-white">{title}</h3>{number === "08" && <div className="mt-3 flex gap-1 text-lg text-lime" aria-label="Contoh rating lima bintang">★★★★★</div>}<p className="mt-3 text-sm leading-6 text-slate-400">{description}</p></article>)}</div></div>
        </section>

        <section className="bg-navy-950 px-5 pb-20 lg:px-10"><div className="court-lines relative mx-auto max-w-7xl overflow-hidden border border-lime/30 bg-navy-800 px-6 py-16 sm:px-12"><div className="relative z-10 max-w-3xl"><p className="eyebrow">Mulai pertandingan Anda</p><h2 className="font-display text-4xl font-extrabold leading-tight sm:text-6xl">Siap cari teman main berikutnya?</h2><p className="mt-5 max-w-2xl leading-7 text-slate-300">Buat akun, pilih level bermain, lalu temukan pertandingan atau sesi latihan yang sesuai.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="bg-lime px-6 py-3.5 font-extrabold text-navy-950">Daftar gratis sekarang →</Link><Link href="/login" className="border border-white/15 px-6 py-3.5 font-bold text-white">Masuk ke akun</Link></div></div></div></section>
      </main>

      <footer className="border-t border-white/10 bg-navy-950 py-14"><div className="mx-auto max-w-7xl px-5 lg:px-10"><div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-5"><div className="md:col-span-2"><div className="font-display text-2xl font-black">SmashMate<span className="text-lime">.</span></div><p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">Platform badminton untuk mencari partner, berlatih dengan coach, mengadakan event, dan reservasi lapangan.</p></div>{[["Produk","Cari mabar","Buat pertandingan","Booking lapangan"],["Fitur","Sesi coaching","Host event","Rating pemain"],["Bantuan","Pusat bantuan","Etika lapangan","Kebijakan privasi"]].map(([title,...links]) => <div key={title}><h3 className="text-xs font-black uppercase tracking-wider">{title}</h3><ul className="mt-4 space-y-2 text-sm text-slate-500">{links.map(link => <li key={link}><a href="#" className="hover:text-lime">{link}</a></li>)}</ul></div>)}</div><div className="pt-7 text-xs text-slate-600"><p>© 2026 SmashMate Indonesia.</p></div></div></footer>
    </div>
  );
}

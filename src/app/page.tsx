/* eslint-disable @next/next/no-img-element */

const playerImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA-z10XmAQIPSeGQ6FkgjE69XZKAVJJUf17L71nMj4GvJZJGPaD4HbmbujfUhLOaFtKHIQ59ToR5jfPJzYltiQyKnG6r73D8cMF6CTZ_1fbM1XnomjQEjOUmakQVQnqyXlTEKLAr-yWwIOuJqrWii50pgDaENJRuaUB-_TEoc6pnLtiQ3pO6BmbMXoImAOx2b_MCpyhdTtbZSTvYwVtYSdaHRMxhbQC5Q2T6cOeaSBetGniBiEVHDBa",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCuJpDcqKzPtpm4oRPC_gcSNY9ptw9LGfQzZUl0iOGNtyD995JVorNyMkVCMJpvhX_RjEDA_tvQIuQ1-Y3MEwIp4M5iSPEGYCEQa6GJu_axBtYfct4oYZAEH5GqRTX9A5OD65dFu9cZzUvc5RrfzZG3Ah6sz-T-CMr0tcJCAUt2ryDfYjUk6nEXlXAXSy-wo7CxmH-CLpVPhO6MsreFdpw-BTgcFAAfxokKX42PEhr-AH4P_4zms59t",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCiza5DaY0mRq0RmjTa-7Hl02Xy9v81L6QPn09hTRm19BVwGeNe9OPVXTn2iHbcFNvjXDsQbVn-RqJFgPqOcZass1QDFQvXzSblIKNb8PdJs_kQm-nNV_07MSzWZJH7xjto3ur2cOEZwTKr0eDztFY5KWXZXnVdzK4zcOpO9D62OBw510W2IwDMmdAk0WLGGKI2vlu1-XzbQ_pB9QxJLh0eeYufAdS0O2ZqbsdpKfl-i32G8RTACZ_Q",
];

const matches = [
  { title: "Ganda Campuran — Intermediate", venue: "GOR Bulungan", time: "Hari ini · 19.00", price: "Rp45K", fit: "98%", slot: "1 slot", role: "Cari pemain depan" },
  { title: "Mabar Santai After Office", venue: "Champion Kuningan", time: "Besok · 20.00", price: "Rp38K", fit: "94%", slot: "2 slot", role: "Semua posisi" },
  { title: "Sparring Ganda Putra", venue: "Candra Wijaya Centre", time: "Sabtu · 09.00", price: "Rp55K", fit: "91%", slot: "1 slot", role: "Cari backcourt" },
];

const heroImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuD9LifXKCKkWtELUZZE5q0Z1qnogh4hzptvuYIrsE5RZEP6KySUa2Cg--6E8nQTqO-cOOtGEvi3RW9N0Lzi-OANCqmfvj5h-CpZGWmubzi0qAIw1OjsdRgrfP5LUs1jmlDgPaByWwsY_b3yhRlm1_QC0Uy_fGQkY0J9JLhrNFa7vpGLswLzd_5HjdK99pmmnTw9d9ahnW178kmhX6RK_3_PT6J-gWuexSMz55tC5YkP_3_DoeG_bWpt";

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

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function CourtDiagram({ index }: { index: number }) {
  return (
    <div className="relative h-36 overflow-hidden border border-lime/40 bg-navy-950 p-3">
      <div className="absolute inset-3 border border-lime/35" />
      <div className="absolute inset-x-3 top-1/2 border-t border-lime/35" />
      <div className="absolute inset-y-3 left-1/2 border-l border-lime/35" />
      <div className="absolute left-[28%] top-[30%] h-7 w-7 overflow-hidden rounded-full border-2 border-lime bg-navy-800">
        <img src={playerImages[index]} alt="Pemain" className="h-full w-full object-cover" />
      </div>
      <div className="absolute bottom-[22%] right-[25%] flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-lime bg-lime/10 text-xs font-black text-lime">?</div>
      <span className="absolute bottom-2 left-3 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">Front court</span>
      <span className="absolute right-3 top-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">Back court</span>
    </div>
  );
}

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
            <a href="#matches" className="hover:text-lime">Cari Mabar</a><a href="#how" className="hover:text-lime">Cara Kerja</a><a href="#features" className="hover:text-lime">Fitur</a>
          </nav>
          <div className="flex items-center gap-3"><button className="hidden text-sm font-bold text-slate-300 sm:block">Masuk</button><a href="#finder" className="rounded bg-lime px-4 py-2.5 text-sm font-extrabold text-navy-950 transition hover:-translate-y-0.5 hover:bg-lime-dark">Gabung Main <span className="ml-1">→</span></a></div>
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
              <div className="mt-8 flex flex-wrap gap-3"><a href="#matches" className="rounded bg-lime px-6 py-3.5 font-extrabold text-navy-950 hover:bg-lime-dark">Cari partner mabar →</a><a href="#how" className="rounded border border-white/15 bg-white/5 px-6 py-3.5 font-bold text-white hover:border-lime/50">Buat match atau latihan</a></div>
            </div>
            <div className="grid content-end gap-3 lg:col-span-4">
              <div className="border border-white/10 bg-navy-800 p-6"><p className="text-xs font-extrabold uppercase tracking-[.14em] text-lime">Satu aplikasi untuk badminton</p><ul className="mt-5 space-y-4 text-sm">{["Cari pemain yang selevel","Buat match atau sesi coaching","Host event badminton","Beri rating setelah bermain"].map(item => <li key={item} className="flex items-center gap-3 border-b border-white/10 pb-3 last:border-0 last:pb-0"><span className="text-lime">✓</span><span>{item}</span></li>)}</ul></div>
            </div>
          </div>

          <div className="relative mt-12 overflow-hidden border border-white/10 bg-navy-900">
            <div className="grid lg:grid-cols-12">
              <div className="relative min-h-[390px] overflow-hidden lg:col-span-8">
                <img src={heroImage} alt="Pertandingan badminton ganda" className="absolute inset-0 h-full w-full object-cover brightness-[.7] saturate-125" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent" />
                <div className="absolute left-5 top-5 border border-white/15 bg-navy-950/85 px-4 py-2 text-xs font-bold backdrop-blur"><span className="mr-2 text-lime">●</span>GOR Champion · Game 3 Match Point</div>
                <div className="absolute bottom-5 left-5 border border-lime/30 bg-navy-950/90 px-4 py-3 text-xs backdrop-blur"><b className="mr-3 rounded bg-lime px-2 py-1 text-navy-950">A+</b> Keselarasan pemain <strong className="text-lime">98.4%</strong></div>
              </div>
              <div className="flex flex-col justify-between border-t border-white/10 p-7 lg:col-span-4 lg:border-l lg:border-t-0">
                <div><p className="text-xs font-bold uppercase tracking-[.16em] text-lime">Court spec insight</p><h2 className="mt-3 font-display text-2xl font-bold">Mabar tanpa kejutan.</h2><p className="mt-3 text-sm leading-6 text-slate-400">Level pemain, posisi bermain, biaya, dan spesifikasi lapangan transparan sebelum kamu bergabung.</p><div className="mt-6 space-y-2 text-xs">{[["Algoritma posisi","Depan & smasher"],["Sistem iuran","Auto-split"],["Sewa raket","Tersedia"]].map(([a,b]) => <div key={a} className="flex justify-between border border-white/10 bg-navy-800 p-3"><span className="text-slate-400">{a}</span><b className="text-lime">{b}</b></div>)}</div></div>
                <p className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-400">Semua informasi tersedia sebelum Anda memutuskan untuk bergabung.</p>
              </div>
            </div>
          </div>

          <div id="finder" className="mt-6 border border-white/10 bg-navy-800 p-5 sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4"><h2 className="font-display text-xl font-bold"><span className="mr-2 text-lime">●</span>Cari sesi mabar terdekat</h2><span className="text-[10px] font-bold uppercase tracking-[.15em] text-lime">Pilih jadwal & level Anda</span></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[["Wilayah GOR",["Jakarta Selatan","Jakarta Barat","Tangerang Selatan"]],["Waktu main",["Malam ini","Besok","Akhir pekan"]],["Level",["Beginner","Intermediate","Professional"]]].map(([label, options]) => <label key={label as string} className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label as string}<select className="mt-2 h-12 w-full border border-white/10 bg-navy-950 px-3 text-sm normal-case tracking-normal text-white outline-none focus:border-lime">{(options as string[]).map(option => <option key={option}>{option}</option>)}</select></label>)}<button className="mt-auto h-12 bg-lime font-extrabold text-navy-950 hover:bg-lime-dark">Cari pertandingan →</button></div>
          </div>
        </section>

        <section id="matches" className="border-y border-white/10 bg-navy-900 py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-10"><div className="mb-10 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Live match rail</p><h2 className="section-title">Tiket pertandingan di dekatmu.</h2></div><a href="#" className="text-sm font-bold text-lime">Lihat semua jadwal <ArrowIcon /></a></div>
            <div className="grid gap-5 lg:grid-cols-3">{matches.map((match,index) => <article key={match.title} className="group border border-white/10 bg-navy-800 transition hover:-translate-y-1 hover:border-lime/50"><CourtDiagram index={index} /><div className="p-5"><div className="flex justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-lime">{match.fit} cocok</span><span className="text-[10px] font-bold uppercase text-rose-300">{match.slot} tersisa</span></div><h3 className="mt-3 font-display text-xl font-bold">{match.title}</h3><p className="mt-2 text-sm text-slate-400">{match.venue} · {match.time}</p><p className="mt-4 border-l-2 border-lime pl-3 text-xs text-slate-300">{match.role}</p><div className="mt-5 flex items-center justify-between border-t border-dashed border-white/15 pt-4"><strong className="font-display text-lg">{match.price}<small className="font-sans text-xs font-normal text-slate-500">/orang</small></strong><button className="bg-lime px-4 py-2 text-xs font-black uppercase tracking-wider text-navy-950">Ambil slot</button></div></div></article>)}</div>
          </div>
        </section>

        <section id="how" className="bg-ivory py-24 text-navy-950">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-12 lg:px-10"><div className="lg:col-span-4"><p className="eyebrow text-burgundy">Cara kerja</p><h2 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">Pilih cara Anda bermain.</h2><p className="mt-5 leading-7 text-slate-600">Cari mabar, tingkatkan kemampuan bersama coach, atau buka event untuk pemain lain.</p></div><div className="relative grid gap-0 border-y border-navy-950/15 lg:col-span-8">{[["01","Pilih aktivitas","Cari match, sesi latihan dengan coach, atau event yang ingin diikuti."],["02","Sesuaikan level","Gunakan kategori Beginner, Intermediate, atau Professional agar pengalaman lebih seimbang."],["03","Main & berinteraksi","Konfirmasi jadwal, lokasi, biaya, dan kebutuhan perlengkapan sebelum bermain."],["04","Beri rating","Setelah selesai, pemain dapat saling memberi rating bintang sebagai referensi berikutnya."]].map(([n,title,desc]) => <div key={n} className="grid gap-3 border-b border-navy-950/15 py-7 last:border-0 sm:grid-cols-[80px_1fr_1.35fr] sm:items-center"><span className="font-display text-4xl font-black text-burgundy">{n}</span><h3 className="font-display text-xl font-bold">{title}</h3><p className="text-sm leading-6 text-slate-600">{desc}</p></div>)}</div></div>
        </section>

        <section id="features" className="bg-navy-950 py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-10"><div className="mb-12 max-w-3xl"><p className="eyebrow">Apa yang bisa dilakukan?</p><h2 className="section-title">Semua yang dibutuhkan untuk berkembang dan bermain.</h2><p className="mt-5 max-w-2xl leading-7 text-slate-400">Dari mencari partner hingga latihan bersama coach dan mengadakan event, SmashMate menyatukan aktivitas badminton dalam satu tempat.</p></div><div className="grid border-l border-t border-white/10 md:grid-cols-2 lg:grid-cols-4">{features.map(([number,title,description]) => <article key={number} className="min-h-60 border-b border-r border-white/10 bg-navy-900/60 p-7 transition hover:bg-navy-800"><span className="font-mono text-xs font-extrabold text-lime">{number}</span><h3 className="mt-7 font-display text-xl font-extrabold text-white">{title}</h3>{number === "08" && <div className="mt-3 flex gap-1 text-lg text-lime" aria-label="Contoh rating lima bintang">★★★★★</div>}<p className="mt-3 text-sm leading-6 text-slate-400">{description}</p></article>)}</div></div>
        </section>

        <section className="bg-navy-950 px-5 pb-20 lg:px-10"><div className="court-lines relative mx-auto max-w-7xl overflow-hidden border border-lime/30 bg-navy-800 px-6 py-16 sm:px-12"><div className="relative z-10 max-w-3xl"><p className="eyebrow">Mulai pertandingan Anda</p><h2 className="font-display text-4xl font-extrabold leading-tight sm:text-6xl">Siap cari teman main berikutnya?</h2><p className="mt-5 max-w-2xl leading-7 text-slate-300">Pilih lokasi, jadwal, dan level bermain. Temukan pertandingan yang cocok tanpa proses yang rumit.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#finder" className="bg-lime px-6 py-3.5 font-extrabold text-navy-950">Cari mabar sekarang →</a><a href="#features" className="border border-white/15 px-6 py-3.5 font-bold text-white">Lihat semua fitur</a></div></div></div></section>
      </main>

      <footer className="border-t border-white/10 bg-navy-950 py-14"><div className="mx-auto max-w-7xl px-5 lg:px-10"><div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-5"><div className="md:col-span-2"><div className="font-display text-2xl font-black">SmashMate<span className="text-lime">.</span></div><p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">Platform badminton untuk mencari partner, berlatih dengan coach, mengadakan event, dan reservasi lapangan.</p></div>{[["Produk","Cari mabar","Buat pertandingan","Booking lapangan"],["Fitur","Sesi coaching","Host event","Rating pemain"],["Bantuan","Pusat bantuan","Etika lapangan","Kebijakan privasi"]].map(([title,...links]) => <div key={title}><h3 className="text-xs font-black uppercase tracking-wider">{title}</h3><ul className="mt-4 space-y-2 text-sm text-slate-500">{links.map(link => <li key={link}><a href="#" className="hover:text-lime">{link}</a></li>)}</ul></div>)}</div><div className="pt-7 text-xs text-slate-600"><p>© 2026 SmashMate Indonesia.</p></div></div></footer>
    </div>
  );
}

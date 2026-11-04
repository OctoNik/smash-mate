import Link from "@/components/loading-link";
import BrandLogo from "@/components/brand-logo";
import BadmintonHeroMotion from "@/components/badminton-hero-motion";
import UtilityLoop from "@/components/utility-loop";

const playerSteps = [
  ["01", "Cari kegiatan", "Lihat mabar, latihan, atau event yang sesuai jadwal dan levelmu."],
  ["02", "Kenali pemainnya", "Buka detail untuk membaca lokasi, aturan, host, dan daftar peserta."],
  ["03", "Konfirmasi gabung", "Kegiatan tersimpan di Aktivitas saya setelah kamu bergabung."],
];
const hostSteps = [
  ["01", "Siapkan lapangan", "Booking GOR, pilih raket sewa dan shuttlecock jika perlu."],
  ["02", "Buka mabar", "Gunakan booking yang terkonfirmasi, lalu tentukan slot dan level pemain."],
  ["03", "Pantau peserta", "Lihat siapa yang bergabung dari halaman detail kegiatan."],
];
const extras = [
  ["Latihan dengan coach", "Pemain yang mengaktifkan profil coach dapat membuka sesi latihan."],
  ["Komunitas dan event", "Buat komunitas, adakan event, dan undang pemain untuk bergabung."],
  ["Perlengkapan dalam booking", "Host menambahkan raket sewa atau shuttlecock dari katalog Mitra GOR."],
  ["Rating setelah bermain", "Pemain dapat memberi penilaian bintang setelah kegiatan dimulai."],
];

export default function Home() {
  return <div className="precision-page">
    <header className="precision-header">
      <div className="precision-shell flex min-h-[76px] items-center justify-between gap-4">
        <BrandLogo />
        <nav className="hidden items-center gap-7 text-sm font-semibold md:flex" aria-label="Navigasi utama">
          <a href="#main-bareng">Main Bareng</a><a href="#sewa-lapangan">Sewa Lapangan</a><a href="#how">Cara Kerja</a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3"><Link href="/login" className="precision-link hidden sm:inline-flex">Masuk</Link><Link href="/register" className="precision-button primary">Daftar Gratis</Link></div>
      </div>
    </header>

    <main>
      <section className="precision-hero">
        <div className="precision-shell grid items-center gap-10 py-14 lg:min-h-[650px] lg:grid-cols-[1.04fr_.96fr] lg:py-20">
          <div>
            <span className="precision-badge">🏸 Tempatnya pemain badminton</span>
            <h1>Temukan mabar.<br /><span>Siapkan lapangan.</span></h1>
            <p>Cari teman main, buka kegiatan, dan booking GOR dalam satu alur. Host dapat menyiapkan raket dan shuttlecock bersama booking lapangan.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/login?next=%2Factivities" className="precision-button primary large">Cari Main Bareng</Link><Link href="/login?next=%2Fvenues" className="precision-button secondary large">Cari Lapangan</Link></div>
            <p className="mt-5 text-xs text-court-950/55">Baru di SmashMate? <Link href="/register" className="font-bold text-court-red underline">Buat akun gratis</Link>.</p>
          </div>
          <BadmintonHeroMotion />
        </div>
      </section>

      <UtilityLoop />

      <section className="precision-section warm" aria-labelledby="paths-title">
        <div className="precision-shell">
          <div className="precision-heading"><p>Mulai dari sini</p><h2 id="paths-title">Mau main atau jadi host?</h2><span>Pilih jalur yang sesuai. Semua kegiatan dan booking yang kamu buat tersimpan di akunmu.</span></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <article id="main-bareng" className="landing-path-card scroll-mt-28 bg-court-950 p-7 text-white sm:p-9">
              <span className="text-xs font-extrabold uppercase tracking-widest text-court-lime">Untuk pemain</span>
              <h3 className="mt-5 font-display text-2xl font-extrabold">Ikut Main Bareng</h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-white/75">Jelajahi mabar, latihan, dan event. Lihat detail serta peserta sebelum memutuskan untuk ikut.</p>
              <Link href="/login?next=%2Factivities" className="precision-button light mt-7">Lihat kegiatan</Link>
            </article>
            <article id="sewa-lapangan" className="landing-path-card scroll-mt-28 bg-white p-7 sm:p-9">
              <span className="text-xs font-extrabold uppercase tracking-widest text-court-red">Untuk host</span>
              <h3 className="mt-5 font-display text-2xl font-extrabold">Booking GOR dan buka mabar</h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-court-950/65">Pilih lapangan, jadwal, dan perlengkapan. Setelah checkout simulasi, buka slot untuk pemain lain.</p>
              <Link href="/login?next=%2Fvenues" className="precision-button primary mt-7">Cari GOR</Link>
            </article>
          </div>
        </div>
      </section>

      <section id="how" className="precision-section" aria-labelledby="how-title">
        <div className="precision-shell">
          <div className="precision-heading"><p>Cara Kerja</p><h2 id="how-title">Dari cari teman sampai bertemu di lapangan.</h2><span>Dua alur singkat untuk pemain dan penyelenggara kegiatan.</span></div>
          <div className="mt-10 grid gap-7 lg:grid-cols-2">
            <div><h3 className="font-display text-xl font-extrabold">Saat ingin ikut bermain</h3><ol className="mt-5 space-y-3">{playerSteps.map(([number, title, copy]) => <li key={number} className="landing-step"><b>{number}</b><span><strong>{title}</strong><small>{copy}</small></span></li>)}</ol></div>
            <div><h3 className="font-display text-xl font-extrabold">Saat menjadi host</h3><ol className="mt-5 space-y-3">{hostSteps.map(([number, title, copy]) => <li key={number} className="landing-step"><b>{number}</b><span><strong>{title}</strong><small>{copy}</small></span></li>)}</ol></div>
          </div>
        </div>
      </section>

      <section id="features" className="precision-section warm" aria-labelledby="features-title">
        <div className="precision-shell">
          <div className="precision-heading"><p>Lebih dari mabar</p><h2 id="features-title">Semua kebutuhan bermain terkumpul.</h2><span>Beginner, intermediate, dan professional dapat mencari kegiatan sesuai levelnya.</span></div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{extras.map(([title, copy]) => <article key={title} className="landing-extra-card"><h3 className="font-display text-lg font-extrabold">{title}</h3><p className="mt-3 text-sm leading-6 text-court-950/65">{copy}</p></article>)}</div>
        </div>
      </section>

      <section className="precision-cta-section"><div className="precision-shell"><div className="precision-cta"><div><p>Siap bermain?</p><h2>Buka kegiatan pertamamu di SmashMate.</h2><span>Daftar sebagai pemain, lalu cari mabar atau siapkan lapangan untuk temanmu.</span></div><div className="flex flex-wrap gap-3"><Link href="/register" className="precision-button light large">Daftar Gratis</Link><Link href="/login" className="precision-button outline-light large">Masuk</Link></div></div></div></section>
    </main>

    <footer className="precision-footer"><div className="precision-shell"><div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-10 sm:flex-row"><div><BrandLogo /><p>Tempat pemain, coach, komunitas, dan Mitra GOR bertemu untuk bermain badminton.</p></div><div className="flex flex-wrap gap-x-7 gap-y-3 text-sm"><a href="#main-bareng">Main Bareng</a><a href="#sewa-lapangan">Sewa Lapangan</a><a href="#how">Cara Kerja</a></div></div><p className="pt-6 text-xs opacity-45">© 2026 SmashMate Indonesia.</p></div></footer>
  </div>;
}

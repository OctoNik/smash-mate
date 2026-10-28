import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import BadmintonHeroMotion from "@/components/badminton-hero-motion";
import UtilityLoop from "@/components/utility-loop";

const steps = [
  ["01", "Buat Profil", "Tentukan level dan preferensi bermain agar aktivitas yang tampil lebih sesuai."],
  ["02", "Pilih Aktivitas", "Cari mabar, sesi coaching, atau event yang cocok dengan jadwal Anda."],
  ["03", "Mulai Bermain", "Datang ke lapangan, nikmati pertandingan, dan bangun koneksi baru."],
];

const features = [
  { title: "Cari Mabar Selevel", text: "Temukan partner atau lawan berdasarkan level, lokasi, dan waktu bermain.", icon: "◎", wide: true },
  { title: "Buat Pertandingan", text: "Tentukan jadwal, kebutuhan pemain, level, dan format pertandingan.", icon: "+" },
  { title: "Latihan dengan Coach", text: "Pilih program dan jadwal latihan sesuai target perkembangan Anda.", icon: "⌁" },
  { title: "Host Event", text: "Atur event untuk pemain atau komunitas dengan alur yang terstruktur.", icon: "◇" },
  { title: "Rating Antar Pemain", text: "Berikan penilaian setelah bermain untuk membangun komunitas sportif.", icon: "★" },
  { title: "Sewa Raket", text: "Temukan pilihan raket untuk disewa saat ingin bermain tanpa membawa perlengkapan sendiri.", icon: "🏸", status: "Dalam pengembangan" },
  { title: "Beli Shuttlecock", text: "Siapkan shuttlecock untuk pertandingan atau latihan dari aplikasi yang sama.", icon: "◈", wide: true, status: "Dalam pengembangan" },
];

const levels = [
  ["Tier 1", "Beginner", "Baru memulai atau bermain rekreasi. Fokus pada teknik dasar dan reli yang nyaman."],
  ["Tier 2", "Intermediate", "Sudah rutin bermain, memahami rotasi, dan mampu menjaga tempo pertandingan."],
  ["Tier 3", "Professional", "Berpengalaman dalam permainan kompetitif dengan teknik dan konsistensi tinggi."],
];

export default function Home() {
  return (
    <div className="precision-page">
      <header className="precision-header">
        <div className="precision-shell flex h-[76px] items-center justify-between">
          <BrandLogo />
          <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex" aria-label="Navigasi utama">
            <a href="#how">Cara Kerja</a><a href="#features">Fitur</a><a href="#levels">Level Pemain</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3"><Link href="/login" className="precision-link hidden sm:inline-flex">Masuk</Link><Link href="/register" className="precision-button primary">Mulai Bermain</Link></div>
        </div>
      </header>

      <main>
        <section className="precision-hero">
          <div className="precision-shell grid items-center gap-12 py-16 lg:min-h-[680px] lg:grid-cols-[1.04fr_.96fr] lg:py-20">
            <div>
              <div className="precision-badge">🏸 Platform badminton Indonesia</div>
              <h1>Temukan teman main.<br /><span>Naikkan levelmu.</span></h1>
              <p>SmashMate menyatukan mabar, pertandingan, coaching, event, sewa raket, dan pembelian shuttlecock dalam satu aplikasi badminton.</p>
              <div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="precision-button primary large">Cari Teman Mabar</Link><a href="#how" className="precision-button secondary large">Lihat Cara Kerja</a></div>
              <div className="precision-notes"><span>Partner sesuai level</span><span>Match, coaching, dan event</span><span>Sewa raket & beli shuttlecock</span></div>
            </div>
            <BadmintonHeroMotion />
          </div>
        </section>

        <UtilityLoop />

        <section id="how" className="precision-section warm">
          <div className="precision-shell"><div className="precision-heading"><p>Cara Kerja</p><h2>Langkah mudah mulai bermain di lapangan.</h2><span>Buat profil singkat, pilih aktivitas yang cocok, lalu bertemu di lapangan.</span></div><div className="mt-12 grid gap-4 md:grid-cols-3">{steps.map(([number, title, text]) => <article key={number} className="precision-step"><div><b>{number}</b></div><h3>{title}</h3><p>{text}</p></article>)}</div></div>
        </section>

        <section id="features" className="precision-section">
          <div className="precision-shell"><div className="precision-heading"><p>Fitur Utama</p><h2>Dari cari teman main sampai menyiapkan perlengkapan.</h2><span>SmashMate dirancang sebagai satu tempat untuk bermain, berlatih, mengadakan event, serta memenuhi kebutuhan raket dan shuttlecock.</span></div><div className="feature-editorial mt-12">{features.map((feature) => <article key={feature.title} className={`precision-feature ${feature.wide ? "wide" : ""}`}><div><span>{feature.icon}</span>{feature.status && <small className="precision-feature-status">{feature.status}</small>}</div><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div></div>
        </section>

        <section id="levels" className="precision-section warm">
          <div className="precision-shell"><div className="precision-heading"><p>Sistem Level Pemain</p><h2>Panduan objektif untuk terus berkembang.</h2><span>Level membantu setiap pemain menemukan pengalaman bermain yang sesuai.</span></div><div className="mt-12 grid gap-4 lg:grid-cols-3">{levels.map(([tier, title, text], index) => <article key={title} className="level-card"><div><span>{tier}</span><b>0{index + 1}</b></div><h3>{title}</h3><p>{text}</p><ul><li>Rekomendasi aktivitas selevel</li><li>Profil kemampuan yang jelas</li></ul></article>)}</div></div>
        </section>

        <section className="precision-cta-section"><div className="precision-shell"><div className="precision-cta"><div><p>Mulai dari sini</p><h2>Partner berikutnya hanya satu langkah lagi.</h2><span>Buat akun dan siapkan perjalanan badminton Anda bersama SmashMate.</span></div><div className="flex flex-wrap gap-3"><Link href="/register" className="precision-button light large">Daftar Gratis</Link><Link href="/login" className="precision-button outline-light large">Masuk</Link></div></div></div></section>
      </main>

      <footer className="precision-footer"><div className="precision-shell"><div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-10 sm:flex-row"><div><BrandLogo /><p>Platform badminton untuk menghubungkan pemain, coach, dan komunitas di Indonesia.</p></div><div className="flex flex-wrap gap-x-7 gap-y-3 text-sm"><a href="#how">Cara Kerja</a><a href="#features">Fitur</a><a href="#levels">Level Pemain</a><span>Pusat Bantuan</span><span>Privasi</span></div></div><p className="pt-6 text-xs opacity-45">© 2026 SmashMate Indonesia.</p></div></footer>
    </div>
  );
}

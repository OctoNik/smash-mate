import Link from "@/components/loading-link";
import BrandLogo from "@/components/brand-logo";

export default function AuthShell({ children }) {
  return (
    <main className="auth-shell grid lg:grid-cols-[1.02fr_.98fr]">
      <section className="auth-aside hidden min-h-screen p-10 lg:flex lg:flex-col lg:justify-between xl:p-14" aria-label="Tentang SmashMate" style={{ backgroundImage: "linear-gradient(180deg, rgba(2, 25, 43, .38), rgba(2, 25, 43, .88)), url('/images/badminton-hero-v2.png')" }}>
        <BrandLogo />
        <div className="auth-story relative z-10 max-w-xl">
          <h2 className="font-display text-5xl font-extrabold leading-[1.06] tracking-[-.05em] xl:text-6xl">Teman main,<br />lapangan, dan momen berikutnya.</h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/85">Cari mabar yang cocok, atur lapangan, lalu bertemu di GOR. Semua bermula dari satu akun pemain.</p>
        </div>
        <p className="relative z-10 text-xs font-semibold text-white/75">Badminton lebih seru saat dimainkan bersama.</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="relative w-full max-w-[29rem]">
          <div className="mb-8 lg:hidden"><BrandLogo /></div>
          <div className="auth-form-card">{children}</div>
          <Link href="/" className="mx-auto mt-6 flex w-fit items-center gap-2 text-xs font-bold text-white/60 hover:text-court-lime">Kembali ke beranda</Link>
        </div>
      </section>
    </main>
  );
}

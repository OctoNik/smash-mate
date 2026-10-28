import Link from "@/components/loading-link";
import BrandLogo from "@/components/brand-logo";

export default function AuthShell({ children }) {
  const features = [
    ["01", "Temukan partner selevel"],
    ["02", "Ikuti match dan coaching"],
    ["03", "Bangun reputasi bermain"],
  ];

  return (
    <main className="auth-shell grid lg:grid-cols-[1.05fr_.95fr]">
      <section className="auth-aside hidden min-h-screen p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <BrandLogo />
        <div className="relative z-10 max-w-xl">
          <div className="pill pill-dark">🏸 SmashMate account</div>
          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.04] tracking-[-.05em] xl:text-6xl">Satu akun.<br /><span className="text-court-lime">Banyak cara bermain.</span></h1>
          <p className="mt-5 max-w-lg leading-7 text-white/55">Mulai sebagai Player, temukan partner yang tepat, lalu kembangkan pengalaman badminton Anda.</p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {features.map(([number, text]) => <div key={number} className="auth-feature"><span>{number}</span><p>{text}</p></div>)}
          </div>
        </div>
        <p className="relative z-10 text-xs text-white/30">© 2026 SmashMate Indonesia</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-10">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-court-lime/5 blur-2xl" />
        <div className="relative w-full max-w-[29rem]">
          <div className="mb-8 lg:hidden"><BrandLogo /></div>
          <div className="auth-form-card">{children}</div>
          <Link href="/" className="mx-auto mt-6 flex w-fit items-center gap-2 text-xs font-bold text-white/60 hover:text-court-lime">Kembali ke beranda</Link>
        </div>
      </section>
    </main>
  );
}

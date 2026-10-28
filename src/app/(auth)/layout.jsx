import Link from "next/link";

export default function AuthLayout({ children }) {
  return (
    <main className="min-h-screen bg-navy-950 text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(520px,0.8fr)]">
        <section className="court-grid relative hidden overflow-hidden border-r border-white/10 p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-10 rotate-[-5deg] border border-lime/10" />
          <Link href="/" className="relative z-10 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-lime font-display text-lg font-black text-navy-950">SM</span>
            <span className="font-display text-2xl font-black">SmashMate<span className="text-lime">.</span></span>
          </Link>
          <div className="relative z-10 max-w-xl">
            <p className="eyebrow">Badminton matchmaker</p>
            <h1 className="font-display text-5xl font-extrabold leading-[1.08]">Satu akun untuk bermain, berlatih, dan berkembang.</h1>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {["Cari mabar selevel", "Latihan dengan coach", "Buat dan ikuti event"].map((item, index) => (
                <div key={item} className="border border-white/10 bg-navy-900/80 p-4 text-sm leading-6 text-slate-300">
                  <span className="mb-4 block font-mono text-xs font-black text-lime">0{index + 1}</span>{item}
                </div>
              ))}
            </div>
          </div>
          <p className="relative z-10 text-xs text-slate-600">© 2026 SmashMate Indonesia</p>
        </section>
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-lime font-display font-black text-navy-950">SM</span>
              <span className="font-display text-xl font-black">SmashMate<span className="text-lime">.</span></span>
            </Link>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import { login } from "@/app/auth/actions";

export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams;

  return (
    <>
      <p className="eyebrow">Selamat datang kembali</p>
      <h1 className="font-display text-4xl font-extrabold text-white">Masuk ke SmashMate.</h1>
      <p className="mt-3 leading-7 text-slate-400">Lanjutkan mencari pertandingan, sesi latihan, dan event badminton.</p>

      {error && <p role="alert" className="mt-6 border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}
      {message && <p className="mt-6 border border-lime/30 bg-lime/10 p-4 text-sm text-lime">{message}</p>}

      <form action={login} className="mt-8 space-y-5">
        <label className="block text-sm font-bold text-slate-200">Email
          <input name="email" type="email" autoComplete="email" required placeholder="nama@email.com" className="mt-2 h-13 w-full border border-white/15 bg-navy-900 px-4 font-normal text-white outline-none placeholder:text-slate-600 focus:border-lime" />
        </label>
        <label className="block text-sm font-bold text-slate-200">Kata sandi
          <input name="password" type="password" autoComplete="current-password" required placeholder="Masukkan kata sandi" className="mt-2 h-13 w-full border border-white/15 bg-navy-900 px-4 font-normal text-white outline-none placeholder:text-slate-600 focus:border-lime" />
        </label>
        <div className="flex justify-end"><span className="text-xs text-slate-500">Lupa kata sandi akan tersedia pada tahap berikutnya.</span></div>
        <button type="submit" className="h-13 w-full bg-lime px-5 font-extrabold text-navy-950 hover:bg-lime-dark">Masuk →</button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-400">Belum punya akun? <Link href="/register" className="font-bold text-lime hover:text-lime-dark">Daftar sekarang</Link></p>
      <Link href="/" className="mt-5 block text-center text-xs font-bold text-slate-500 hover:text-white">← Kembali ke landing page</Link>
    </>
  );
}

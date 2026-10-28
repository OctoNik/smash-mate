import Link from "next/link";
import { login } from "@/app/auth/actions";
import SubmitButton from "@/components/submit-button";

export const instant = false;

export default async function LoginView({ searchParams }) {
  const { error, message } = await searchParams;
  return (
    <>
      <p className="eyebrow text-court-lime">Selamat datang kembali</p>
      <h1 className="font-display text-4xl font-extrabold tracking-[-.045em] text-white">Masuk ke lapangan.</h1>
      <p className="mt-3 text-sm leading-6 text-white/45">Lanjutkan mencari match, latihan, dan event badminton Anda.</p>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-400/25 bg-red-400/8 p-4 text-sm leading-6 text-red-200">{error}</p>}
      {message && <p className="mt-6 rounded-xl border border-court-lime/25 bg-court-lime/8 p-4 text-sm leading-6 text-court-lime">{message}</p>}
      <form action={login} className="mt-8 space-y-5">
        <label className="form-label">Email<input name="email" type="email" autoComplete="email" required placeholder="nama@email.com" className="form-input" /></label>
        <label className="form-label">Kata sandi<input name="password" type="password" autoComplete="current-password" required placeholder="Masukkan kata sandi" className="form-input" /></label>
        <div className="flex justify-end"><span className="text-[11px] text-white/30">Lupa kata sandi segera tersedia</span></div>
        <SubmitButton pendingText="Sedang masuk..." className="btn btn-primary btn-large w-full">Masuk ke SmashMate</SubmitButton>
      </form>
      <div className="my-7 flex items-center gap-3 text-[10px] uppercase tracking-[.16em] text-white/20"><span className="h-px flex-1 bg-white/8" />atau<span className="h-px flex-1 bg-white/8" /></div>
      <p className="text-center text-sm text-white/45">Belum punya akun? <Link href="/register" className="font-extrabold text-court-lime hover:text-white">Daftar gratis</Link></p>
    </>
  );
}

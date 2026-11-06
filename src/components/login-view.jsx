import Link from "@/components/loading-link";
import { login } from "@/app/auth/actions";
import SubmitButton from "@/components/submit-button";

export const instant = false;

export default async function LoginView({ searchParams }) {
  const { error, message, next: requestedNext } = await searchParams;
  const next = ["/activities", "/venues", "/dashboard"].includes(requestedNext) ? requestedNext : "/dashboard";
  return (
    <>
      <p className="eyebrow text-court-lime">Akun pemain</p>
      <h1 className="font-display text-4xl font-extrabold tracking-[-.045em] text-white">Masuk ke SmashMate</h1>
      <p className="mt-3 text-sm leading-6 text-white/75">Lihat jadwal main, booking, dan komunitas Anda.</p>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-400/25 bg-red-400/8 p-4 text-sm leading-6 text-red-200">{error}</p>}
      {message && <p role="status" className="mt-6 rounded-xl border border-court-lime/25 bg-court-lime/8 p-4 text-sm leading-6 text-court-lime">{message}</p>}
      <form action={login} className="mt-8 space-y-5">
        <input type="hidden" name="next" value={next} />
        <label className="form-label">Email<input name="email" type="email" autoComplete="email" spellCheck={false} required placeholder="nama@email.com…" className="form-input" /></label>
        <label className="form-label">Kata sandi<input name="password" type="password" autoComplete="current-password" required placeholder="Kata sandi akun…" className="form-input" /></label>
        <SubmitButton pendingText="Sedang masuk…" className="btn btn-primary btn-large w-full">Masuk</SubmitButton>
      </form>
      <p className="mt-7 border-t border-white/15 pt-6 text-center text-sm text-white/75">Belum punya akun? <Link href="/register" className="font-extrabold text-court-lime hover:text-white">Daftar gratis</Link></p>
    </>
  );
}
